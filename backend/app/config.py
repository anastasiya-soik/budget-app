from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    BOT_TOKEN: str
    FRONTEND_URL: str
    EXTRA_ORIGINS: str = ""  # comma-separated extra allowed origins (e.g. localhost for dev)
    SENTRY_DSN: str = ""
    BACKEND_URL: str = ""  # e.g. https://api.example.railway.app — for webhook auto-registration
    REDIS_URL: str = ""  # redis://... — if set, used for rate-limit storage
    ADMIN_TELEGRAM_ID: int = 0  # Telegram ID of the owner, 0 = disabled
    # comma-separated Host headers to accept (e.g. "api.example.com,api.example.up.railway.app").
    # Left empty by default so TrustedHostMiddleware stays a no-op (allow_hosts=["*"]) until
    # an operator opts in — the platform's healthcheck Host header isn't guaranteed to match
    # the public domain, so enforcing this blind could 400 your own healthcheck.
    ALLOWED_HOSTS: str = ""

    @property
    def ALLOWED_ORIGINS(self) -> list[str]:
        origins = [self.FRONTEND_URL]
        if self.EXTRA_ORIGINS:
            origins.extend(o.strip() for o in self.EXTRA_ORIGINS.split(",") if o.strip())
        return origins

    @property
    def TRUSTED_HOSTS(self) -> list[str]:
        if not self.ALLOWED_HOSTS:
            return ["*"]
        return [h.strip() for h in self.ALLOWED_HOSTS.split(",") if h.strip()]


settings = Settings()
