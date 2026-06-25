import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.transaction import Transaction
from app.models.user import User
from app.services import analytics_service, telegram_service

logger = logging.getLogger(__name__)


def _fmt(cents: int, currency: str) -> str:
    return f"{cents / 100:.2f} {currency}"


def _is_admin(telegram_id: int) -> bool:
    return settings.ADMIN_TELEGRAM_ID != 0 and telegram_id == settings.ADMIN_TELEGRAM_ID


_BTN_STATS = "📊 Статистика"
_BTN_HELP = "❓ Помощь"

_REPLY_KB = {
    "keyboard": [[_BTN_STATS, _BTN_HELP]],
    "resize_keyboard": True,
    "persistent": True,
}


async def handle_update(update: dict, db: AsyncSession) -> None:
    message = update.get("message") or update.get("edited_message")
    if not message:
        return
    text: str = message.get("text", "")
    telegram_id: int | None = message.get("from", {}).get("id")
    if not telegram_id or not text:
        return

    cmd = text.split()[0].split("@")[0] if text.startswith("/") else text

    if cmd == "/start":
        await _cmd_start(telegram_id)
    elif cmd in ("/stats", _BTN_STATS):
        await _cmd_stats(telegram_id, db)
    elif cmd in ("/help", _BTN_HELP):
        await _cmd_help(telegram_id)
    elif cmd == "/admin" and _is_admin(telegram_id):
        await _cmd_admin_stats(telegram_id, db)
    elif text.startswith("/broadcast ") and _is_admin(telegram_id):
        broadcast_text = text[len("/broadcast "):].strip()
        if broadcast_text:
            await _cmd_broadcast(telegram_id, broadcast_text, db)


async def _cmd_start(telegram_id: int) -> None:
    text = (
        "👋 Привет! Я — purrse, умный трекер финансов.\n\n"
        "Отслеживай доходы и расходы по категориям, "
        "ставь цели и контролируй бюджет.\n\n"
        "Нажми кнопку ниже, чтобы открыть приложение 👇"
    )
    inline_kb = {
        "inline_keyboard": [[
            {"text": "💰 Открыть purrse", "web_app": {"url": settings.FRONTEND_URL}}
        ]]
    }
    await telegram_service.send_message(telegram_id, text, reply_markup=inline_kb)
    await telegram_service.send_message(
        telegram_id,
        "Быстрые кнопки всегда под рукой 👇",
        reply_markup=_REPLY_KB,
    )


async def _cmd_stats(telegram_id: int, db: AsyncSession) -> None:
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        await telegram_service.send_message(
            telegram_id,
            "❓ Аккаунт не найден.\n"
            "Открой приложение и войди через Telegram, чтобы привязать аккаунт.",
        )
        return

    now = datetime.now(timezone.utc)
    data = await analytics_service.summary(user.id, now.year, now.month, db)
    currency = user.currency
    income = _fmt(data["income_cents"], currency)
    expense = _fmt(data["expense_cents"], currency)
    balance_cents = data["balance_cents"]
    sign = "+" if balance_cents >= 0 else ""
    balance = sign + _fmt(abs(balance_cents), currency)
    month_str = now.strftime("%B %Y")

    text = (
        f"📊 *{month_str}*\n\n"
        f"⬆️ Доходы: `{income}`\n"
        f"⬇️ Расходы: `{expense}`\n"
        f"💰 Баланс: `{balance}`"
    )
    await telegram_service.send_message(telegram_id, text, parse_mode="Markdown")


async def _cmd_help(telegram_id: int) -> None:
    text = (
        "🐱 *purrse — команды*\n\n"
        "/start — приветствие и кнопка открыть приложение\n"
        "/stats — статистика за текущий месяц\n"
        "/help — эта справка\n\n"
        "Всё остальное доступно в приложении 💰"
    )
    if _is_admin(telegram_id):
        text += "\n\n🔐 *Админ:*\n/admin — статистика по пользователям\n/broadcast <текст> — рассылка всем"
    await telegram_service.send_message(telegram_id, text, parse_mode="Markdown")


async def _cmd_admin_stats(telegram_id: int, db: AsyncSession) -> None:
    now = datetime.now(timezone.utc)
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_users = (await db.execute(
        select(func.count()).select_from(User)
    )).scalar_one()

    tg_users = (await db.execute(
        select(func.count()).select_from(User).where(User.telegram_id.isnot(None))
    )).scalar_one()

    new_users = (await db.execute(
        select(func.count()).select_from(User).where(User.created_at >= first_of_month)
    )).scalar_one()

    total_tx = (await db.execute(
        select(func.count()).select_from(Transaction).where(Transaction.deleted_at.is_(None))
    )).scalar_one()

    month_tx = (await db.execute(
        select(func.count()).select_from(Transaction)
        .where(Transaction.deleted_at.is_(None))
        .where(Transaction.tx_date >= first_of_month.date())
    )).scalar_one()

    active_users = (await db.execute(
        select(func.count(Transaction.user_id.distinct()))
        .where(Transaction.deleted_at.is_(None))
        .where(Transaction.tx_date >= first_of_month.date())
    )).scalar_one()

    month_str = now.strftime("%B %Y")
    text = (
        f"🔐 *Админ-панель purrse*\n\n"
        f"👥 *Пользователи:*\n"
        f"• Всего: {total_users}\n"
        f"• С Telegram: {tg_users}\n"
        f"• Новых за {month_str}: {new_users}\n\n"
        f"📊 *Активность за {month_str}:*\n"
        f"• Транзакций: {month_tx}\n"
        f"• Активных юзеров: {active_users}\n"
        f"• Всего транзакций в БД: {total_tx:,}"
    )
    await telegram_service.send_message(telegram_id, text, parse_mode="Markdown")


async def _cmd_broadcast(telegram_id: int, broadcast_text: str, db: AsyncSession) -> None:
    result = await db.execute(select(User).where(User.telegram_id.isnot(None)))
    users = result.scalars().all()

    keyboard = {
        "inline_keyboard": [[
            {"text": "💰 Открыть purrse", "web_app": {"url": settings.FRONTEND_URL}}
        ]]
    }

    sent = 0
    errors = 0
    for user in users:
        if user.telegram_id == telegram_id:
            continue  # skip self — admin gets the report at the end
        try:
            await telegram_service.send_message(
                user.telegram_id, broadcast_text, reply_markup=keyboard
            )
            sent += 1
        except Exception:
            logger.exception("Broadcast failed for user %s", user.id)
            errors += 1

    report = f"✅ Рассылка завершена\n\nОтправлено: {sent}\nОшибок: {errors}"
    await telegram_service.send_message(telegram_id, report)


async def send_monthly_summary(db: AsyncSession) -> None:
    """Send previous month summary to all Telegram users. Runs on the 1st of each month."""
    now = datetime.now(timezone.utc)
    year, month = (now.year - 1, 12) if now.month == 1 else (now.year, now.month - 1)
    month_str = datetime(year, month, 1).strftime("%B %Y")

    result = await db.execute(select(User).where(User.telegram_id.isnot(None)))
    users = result.scalars().all()

    for user in users:
        try:
            data = await analytics_service.summary(user.id, year, month, db)
            currency = user.currency
            income = _fmt(data["income_cents"], currency)
            expense = _fmt(data["expense_cents"], currency)
            balance_cents = data["balance_cents"]
            sign = "+" if balance_cents >= 0 else ""
            balance = sign + _fmt(abs(balance_cents), currency)

            text = (
                f"📅 *Итоги {month_str}*\n\n"
                f"⬆️ Доходы: `{income}`\n"
                f"⬇️ Расходы: `{expense}`\n"
                f"💰 Баланс: `{balance}`\n\n"
                "Подробнее — в приложении 👇"
            )
            keyboard = {
                "inline_keyboard": [[
                    {"text": "📊 Открыть purrse", "web_app": {"url": settings.FRONTEND_URL}}
                ]]
            }
            await telegram_service.send_message(
                user.telegram_id, text, parse_mode="Markdown", reply_markup=keyboard
            )
        except Exception:
            logger.exception("Failed monthly summary for user %s", user.id)
