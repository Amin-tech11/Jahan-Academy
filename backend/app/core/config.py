from functools import lru_cache

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="JAHAN_", extra="ignore")

    app_name: str = "Jahan Academy API"
    app_version: str = "0.1.0"
    environment: str = Field(default="local", pattern="^(local|test|staging|production)$")
    log_level: str = "INFO"
    docs_enabled: bool = True
    database_url: str = "postgresql+asyncpg://jahan:jahan_local@localhost:55432/jahan_academy"
    redis_url: str = "redis://localhost:6379/0"
    session_cookie_name: str = "jahan_session"
    refresh_cookie_name: str = "jahan_refresh"
    csrf_cookie_name: str = "jahan_csrf"
    session_secret: SecretStr = SecretStr("local-only-change-me-at-least-32-characters")
    jwt_issuer: str = "jahan-academy"
    jwt_audience: str = "jahan-academy-api"
    access_token_minutes: int = Field(default=15, ge=5, le=60)
    refresh_token_days: int = Field(default=30, ge=1, le=90)
    email_verification_hours: int = Field(default=24, ge=1, le=72)
    password_reset_minutes: int = Field(default=30, ge=10, le=120)
    login_max_attempts: int = Field(default=5, ge=3, le=20)
    login_lock_minutes: int = Field(default=15, ge=1, le=1440)
    cookie_secure: bool = False
    frontend_url: str = "http://localhost:3000"
    smtp_host: str = "localhost"
    smtp_port: int = Field(default=1025, ge=1, le=65535)
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    smtp_start_tls: bool = False
    email_from: str = "no-reply@jahanacademy.local"
    privacy_policy_version: str = "1.0"
    contact_consent_version: str = "1.0"
    consultation_duplicate_window_hours: int = Field(default=24, ge=1, le=168)
    consultation_rate_limit: int = Field(default=5, ge=1, le=100)
    consultation_rate_window_seconds: int = Field(default=600, ge=60, le=86400)
    noura_base_url: str = "http://mock-noura:8090"
    noura_timeout_seconds: float = Field(default=5.0, gt=0, le=60)
    noura_mock_outcome: str = Field(
        default="success", pattern="^(success|retryable_failure|permanent_failure)$"
    )
    noura_dispatch_batch_size: int = Field(default=20, ge=1, le=100)
    noura_lock_timeout_seconds: int = Field(default=600, ge=30, le=3600)

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.environment == "production":
            if len(self.session_secret.get_secret_value()) < 32:
                raise ValueError("JAHAN_SESSION_SECRET must contain at least 32 characters")
            if not self.cookie_secure:
                raise ValueError("JAHAN_COOKIE_SECURE must be true in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
