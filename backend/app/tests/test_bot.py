import hashlib
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings

_BOT_TOKEN = "test-bot-token"
_WEBHOOK_SECRET = hashlib.sha256(_BOT_TOKEN.encode()).hexdigest()
_ADMIN_ID = 111222333


def _count_result(value):
    r = MagicMock()
    r.scalar_one = MagicMock(return_value=value)
    return r


@pytest.fixture
async def client():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as c:
        yield c


@pytest.mark.asyncio
async def test_webhook_no_secret(client):
    resp = await client.post("/bot/webhook", json={"update_id": 1})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_webhook_wrong_secret(client):
    resp = await client.post(
        "/bot/webhook",
        json={"update_id": 1},
        headers={"X-Telegram-Bot-Api-Secret-Token": "wrong"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_webhook_valid_secret_unknown_update(client):
    with patch("app.services.bot_service.handle_update", new_callable=AsyncMock) as mock_handle:
        resp = await client.post(
            "/bot/webhook",
            json={"update_id": 1},
            headers={"X-Telegram-Bot-Api-Secret-Token": _WEBHOOK_SECRET},
        )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
    mock_handle.assert_awaited_once()


@pytest.mark.asyncio
async def test_webhook_start_command(client):
    update = {
        "update_id": 2,
        "message": {
            "message_id": 1,
            "from": {"id": 12345, "is_bot": False, "first_name": "Test"},
            "chat": {"id": 12345, "type": "private"},
            "text": "/start",
        },
    }
    with patch("app.services.telegram_service.send_message", new_callable=AsyncMock) as mock_send:
        resp = await client.post(
            "/bot/webhook",
            json=update,
            headers={"X-Telegram-Bot-Api-Secret-Token": _WEBHOOK_SECRET},
        )
    assert resp.status_code == 200
    assert mock_send.await_count == 2
    first_call = mock_send.call_args_list[0]
    assert first_call[0][0] == 12345  # telegram_id
    assert "purrse" in first_call[0][1]  # welcome text
    assert first_call[1].get("reply_markup") is not None  # has WebApp button


@pytest.mark.asyncio
async def test_webhook_stats_user_not_found(client):
    update = {
        "update_id": 3,
        "message": {
            "message_id": 2,
            "from": {"id": 99999, "is_bot": False, "first_name": "NoUser"},
            "chat": {"id": 99999, "type": "private"},
            "text": "/stats",
        },
    }
    with patch("app.services.telegram_service.send_message", new_callable=AsyncMock) as mock_send:
        resp = await client.post(
            "/bot/webhook",
            json=update,
            headers={"X-Telegram-Bot-Api-Secret-Token": _WEBHOOK_SECRET},
        )
    assert resp.status_code == 200
    mock_send.assert_awaited_once()
    assert "не найден" in mock_send.call_args[0][1]


@pytest.mark.asyncio
async def test_start_shows_admin_button_for_admin(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_TELEGRAM_ID", _ADMIN_ID)
    update = {
        "update_id": 4,
        "message": {
            "message_id": 3,
            "from": {"id": _ADMIN_ID, "is_bot": False, "first_name": "Admin"},
            "chat": {"id": _ADMIN_ID, "type": "private"},
            "text": "/start",
        },
    }
    with patch("app.services.telegram_service.send_message", new_callable=AsyncMock) as mock_send:
        resp = await client.post(
            "/bot/webhook",
            json=update,
            headers={"X-Telegram-Bot-Api-Secret-Token": _WEBHOOK_SECRET},
        )
    assert resp.status_code == 200
    reply_kb = mock_send.call_args_list[1][1]["reply_markup"]
    buttons = reply_kb["keyboard"][0]
    assert any("Админ" in b for b in buttons)


@pytest.mark.asyncio
async def test_start_hides_admin_button_for_non_admin(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_TELEGRAM_ID", _ADMIN_ID)
    update = {
        "update_id": 5,
        "message": {
            "message_id": 4,
            "from": {"id": 12345, "is_bot": False, "first_name": "Test"},
            "chat": {"id": 12345, "type": "private"},
            "text": "/start",
        },
    }
    with patch("app.services.telegram_service.send_message", new_callable=AsyncMock) as mock_send:
        resp = await client.post(
            "/bot/webhook",
            json=update,
            headers={"X-Telegram-Bot-Api-Secret-Token": _WEBHOOK_SECRET},
        )
    assert resp.status_code == 200
    reply_kb = mock_send.call_args_list[1][1]["reply_markup"]
    buttons = reply_kb["keyboard"][0]
    assert not any("Админ" in b for b in buttons)


@pytest.mark.asyncio
async def test_admin_button_triggers_admin_stats(monkeypatch):
    from app.dependencies import get_db
    from app.main import app

    monkeypatch.setattr(settings, "ADMIN_TELEGRAM_ID", _ADMIN_ID)

    # total_users, tg_users, new_users, total_tx, month_tx, active_users — in query order
    db_mock = AsyncMock()
    db_mock.execute = AsyncMock(side_effect=[
        _count_result(42), _count_result(30), _count_result(5),
        _count_result(120), _count_result(20), _count_result(8),
    ])
    app.dependency_overrides[get_db] = lambda: (yield db_mock)

    update = {
        "update_id": 6,
        "message": {
            "message_id": 5,
            "from": {"id": _ADMIN_ID, "is_bot": False, "first_name": "Admin"},
            "chat": {"id": _ADMIN_ID, "type": "private"},
            "text": "⚙️ Админ-панель",
        },
    }
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as c:
            with patch(
                "app.services.telegram_service.send_message", new_callable=AsyncMock
            ) as mock_send:
                resp = await c.post(
                    "/bot/webhook",
                    json=update,
                    headers={"X-Telegram-Bot-Api-Secret-Token": _WEBHOOK_SECRET},
                )
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    mock_send.assert_awaited_once()
    sent_text = mock_send.call_args[0][1]
    assert "Админ-панель" in sent_text
    assert "42" in sent_text  # total_users made it into the report


@pytest.mark.asyncio
async def test_admin_button_ignored_for_non_admin(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_TELEGRAM_ID", _ADMIN_ID)
    update = {
        "update_id": 7,
        "message": {
            "message_id": 6,
            "from": {"id": 12345, "is_bot": False, "first_name": "Test"},
            "chat": {"id": 12345, "type": "private"},
            "text": "⚙️ Админ-панель",
        },
    }
    with patch("app.services.telegram_service.send_message", new_callable=AsyncMock) as mock_send:
        resp = await client.post(
            "/bot/webhook",
            json=update,
            headers={"X-Telegram-Bot-Api-Secret-Token": _WEBHOOK_SECRET},
        )
    assert resp.status_code == 200
    mock_send.assert_not_awaited()
