# 🐱 purrse — Finance Tracker

Track expenses by category, set goals, plan budget. Web app + Telegram Mini App.

[App](https://budgetapp-production-a39a.up.railway.app) · [Bot](https://t.me/simple_budget_app_bot/purrse)

---

## What It Does

- Add/search transactions by category, date, note
- Custom categories with colors (up to 50)
- Monthly summary, 6-month trends, pie charts
- Budget limits with Telegram alerts at 80%
- Savings goals with month-to-completion forecast
- Recurring transactions (weekly/monthly/yearly)
- CSV export with date filters
- Telegram bot for quick stats
- Dark/light mode, English/Russian

---

## Tech

**Frontend:** React 18, Vite, React Query, Zustand, Tailwind  
**Backend:** FastAPI, SQLAlchemy 2 (async), PostgreSQL, Redis  
**Deploy:** Railway (auto-deploy on main)  
**Security:** JWT + refresh tokens, Bandit SAST, 70%+ test coverage

---

## Setup

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install && npm run dev

# Test
cd backend && pytest --cov=app
cd frontend && npm test
```

---

## CI/CD

PR checks: Ruff → Bandit → pytest (70%+) → ESLint → Vite → vitest → Docker → Trivy

HIGH severity blocks merge. Auto-deploy to Railway on merge.

---

## Env Vars

```
DATABASE_URL=postgresql+asyncpg://...
JWT_SECRET=<64-char-hex>
BOT_TOKEN=<from-botfather>
FRONTEND_URL=<cors-origin>
SENTRY_DSN=<optional>
REDIS_URL=<optional>
```

---

## About

Testing product ideas on real code. This is one of them. Star if you fork it! ⭐

License: MIT

---
---

# 🐱 purrse — Трекер финансов

Отслеживай расходы по категориям, ставь цели, плани бюджет. Веб + Telegram Mini App.

[Приложение](https://budgetapp-production-a39a.up.railway.app) · [Бот](https://t.me/simple_budget_app_bot/purrse)

---

## Что умеет

- Добавлять/искать транзакции по категориям, дате, заметкам
- Кастомные категории с цветами (до 50)
- Итоги за месяц, тренды за 6 месяцев, графики
- Лимиты на категории с алертами в Telegram (80%)
- Цели накоплений с прогнозом месяцев до достижения
- Повторяющиеся транзакции (еженедельные/ежемесячные/ежегодные)
- Экспорт в CSV с фильтром по датам
- Telegram бот для быстрой статистики
- Dark/light mode, English/Russian

---

## Стек

**Frontend:** React 18, Vite, React Query, Zustand, Tailwind  
**Backend:** FastAPI, SQLAlchemy 2 (async), PostgreSQL, Redis  
**Деплой:** Railway (auto-deploy из main)  
**Безопасность:** JWT + refresh токены, Bandit SAST, 70%+ покрытие тестами

---

## Запуск

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install && npm run dev

# Тесты
cd backend && pytest --cov=app
cd frontend && npm test
```

---

## CI/CD

Checks: Ruff → Bandit → pytest (70%+) → ESLint → Vite → vitest → Docker → Trivy

HIGH severity блокирует мерж. Auto-deploy в Railway при мерже.

---

## Переменные

```
DATABASE_URL=postgresql+asyncpg://...
JWT_SECRET=<64-char-hex>
BOT_TOKEN=<от-botfather>
FRONTEND_URL=<cors-origin>
SENTRY_DSN=<опционально>
REDIS_URL=<опционально>
```

---

## О проекте

Тестирую продуктовые идеи на реальном коде. Это одна из них. Звёздочку если форкаешь! ⭐

Лицензия: MIT
