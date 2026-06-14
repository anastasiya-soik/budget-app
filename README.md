# 🐱 purrse — умный трекер финансов

> Отслеживай доходы и расходы по категориям, ставь цели накоплений и планируй бюджет.
> Доступно как веб-приложение и Telegram Mini App.

**Приложение:** [budgetapp-production-a39a.up.railway.app](https://budgetapp-production-a39a.up.railway.app) · **Бот:** [@simple_budget_app_bot](https://t.me/simple_budget_app_bot/purrse)

---

## Возможности

- **Транзакции** — добавление доходов/расходов по категориям, дате и заметке; подтверждение удаления; полнотекстовый поиск
- **Категории** — кастомные категории с цветами; до 50 на пользователя
- **Аналитика** — итоги за месяц, savings rate, средние расходы за 3 мес, круговая диаграмма, тренд за 6 месяцев
- **Бюджет** — лимиты по категориям; навигация по месяцам ← →; уведомление в Telegram при 80%
- **Цели накоплений** — прогресс с расчётом месяцев до достижения
- **Повторяющиеся транзакции** — еженедельные / ежемесячные / ежегодные; пауза и возобновление
- **Импорт / экспорт CSV** — превью с маппингом колонок перед импортом; экспорт с фильтрами по датам
- **Telegram-бот** — `/stats` — моментальная статистика за месяц; дайджест 1-го числа; алерты бюджета
- **GDPR** — полный экспорт данных в JSON; удаление аккаунта с каскадом
- **Двуязычность** — EN / RU, dark / light mode

---

## Стек

| Слой | Технологии |
|---|---|
| Frontend | React 18, Vite 5, React Query 5, Zustand 4, Framer Motion, Recharts, Tailwind CSS 3 |
| Backend | FastAPI 0.115, SQLAlchemy 2 (async), PostgreSQL 16, Alembic, Pydantic v2 |
| Авторизация | JWT HS256 (15 мин) + httpOnly refresh cookie (30 дней), bcrypt, Telegram initData HMAC |
| Инфраструктура | Railway (backend + frontend + PostgreSQL + Redis), Docker multi-stage, GitHub Actions CI |
| Мониторинг | Sentry, структурированные логи |
| Безопасность | OWASP Top 10, Bandit SAST, Trivy scan, rate limiting через slowapi + Redis |

---

## Архитектура

```
Telegram Bot / Браузер
        │
        ▼
  FastAPI (Railway)
   ├── /auth           — JWT + refresh токены
   ├── /transactions
   ├── /categories
   ├── /analytics
   ├── /budgets
   ├── /goals
   ├── /recurring
   └── /bot/webhook    — Telegram обновления
        │
   PostgreSQL (Railway) + Redis (rate limits)
```

- Деньги хранятся как **целые числа в центах** — никаких ошибок округления float
- Все запросы фильтруются по `current_user.id` — broken access control невозможен
- Cursor-based пагинация (без OFFSET)
- APScheduler cron: повторяющиеся транзакции ежедневно, Telegram-дайджест 1-го числа

---

## Запуск локально

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env   # заполни DATABASE_URL, JWT_SECRET, BOT_TOKEN, FRONTEND_URL
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Тесты
cd backend && pytest --cov=app --cov-report=term-missing   # 110 тестов, покрытие 93.7%
cd frontend && npm test                                     # 60 тестов

# Сканирование безопасности
bandit -r app -ll
```

---

## CI/CD

Каждый PR проходит: **Ruff** → **Bandit** → **pytest ≥ 70% покрытия** → **ESLint** → **Vite build** → **vitest** → **Docker build** → **Trivy scan**

Находки HIGH severity блокируют мерж. При мерже в `main` Railway деплоит автоматически.

---

## Переменные окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` |
| `JWT_SECRET` | 64-символьный hex (`openssl rand -hex 32`) |
| `BOT_TOKEN` | Токен от BotFather |
| `FRONTEND_URL` | CORS origin + URL для Telegram WebApp |
| `BACKEND_URL` | Для авторегистрации вебхука Telegram |
| `REDIS_URL` | Redis для хранения rate-limit счётчиков (опционально, fallback в память) |
| `SENTRY_DSN` | Трекинг ошибок |

---

## Лицензия

MIT
