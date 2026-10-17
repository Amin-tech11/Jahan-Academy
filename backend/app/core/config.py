import base64
from functools import lru_cache

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mfa_encryption_key: SecretStr | None = None

    @field_validator("mfa_encryption_key")
    @classmethod
    def validate_mfa_key(cls, value: SecretStr | None) -> SecretStr | None:
        if value is not None:
            try:
                decoded = base64.b64decode(value.get_secret_value(), altchars=b"-_", validate=True)
            except ValueError:
                raise ValueError("Invalid MFA encryption key") from None
            if len(decoded) != 32:
                raise ValueError("MFA encryption key must encode 32 bytes")
        return value

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
    session_idle_minutes: int = Field(default=30, ge=1, le=1440)
    session_absolute_hours: int = Field(default=12, ge=1, le=24)
    staff_session_idle_minutes: int = Field(default=15, ge=1, le=1440)
    staff_session_absolute_hours: int = Field(default=8, ge=1, le=24)
    email_verification_hours: int = Field(default=24, ge=1, le=72)
    password_reset_minutes: int = Field(default=30, ge=10, le=120)
    login_max_attempts: int = Field(default=5, ge=3, le=20)
    login_lock_minutes: int = Field(default=15, ge=1, le=1440)
    login_failure_window_seconds: int = Field(default=900, ge=1, le=86400)
    auth_rate_window_seconds: int = Field(default=900, ge=1, le=86400)
    auth_ip_limit: int = Field(default=30, ge=1, le=10000)
    auth_identifier_limit: int = Field(default=10, ge=1, le=10000)
    auth_email_identifier_limit: int = Field(default=3, ge=1, le=100)
    auth_refresh_ip_limit: int = Field(default=120, ge=1, le=10000)
    auth_refresh_identifier_limit: int = Field(default=60, ge=1, le=10000)
    cookie_secure: bool = False
    frontend_url: str = "http://localhost:3000"
    smtp_host: str = "localhost"
    smtp_port: int = Field(default=1025, ge=1, le=65535)
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    smtp_start_tls: bool = False
    smtp_use_tls: bool = False
    smtp_timeout_seconds: float = Field(default=10, gt=0, le=30)
    email_delivery_enabled: bool = True
    trusted_proxy_secret: SecretStr | None = None
    email_from: str = "no-reply@jahanacademy.local"
    privacy_policy_version: str = "1.0"
    contact_consent_version: str = "1.0"
    consultation_duplicate_window_hours: int = Field(default=24, ge=1, le=168)
    consultation_rate_limit: int = Field(default=5, ge=1, le=100)
    consultation_rate_window_seconds: int = Field(default=600, ge=60, le=86400)
    api_rate_limit: int = Field(default=120, ge=10, le=10_000)
    api_rate_window_seconds: int = Field(default=60, ge=10, le=3600)
    monitoring_token: SecretStr | None = None
    lead_retention_years: int = Field(default=3, ge=1, le=10)
    retention_batch_size: int = Field(default=200, ge=1, le=1000)
    sheets_backup_enabled: bool = False
    sheets_backup_spreadsheet_id: str = Field(
        default="1D-OEZf_lO8pym4ZYqBxCjsMYYfG-HG109jMmx2dBK4A", pattern=r"^[A-Za-z0-9_-]+$"
    )
    sheets_backup_credentials_file: str = "/run/secrets/google-service-account.json"
    noura_base_url: str = "http://mock-noura:8090"
    noura_timeout_seconds: float = Field(default=5.0, gt=0, le=60)
    noura_mock_outcome: str = Field(
        default="success", pattern="^(success|retryable_failure|permanent_failure)$"
    )
    noura_dispatch_batch_size: int = Field(default=20, ge=1, le=100)
    noura_lock_timeout_seconds: int = Field(default=600, ge=30, le=3600)
    storage_endpoint_url: str = "http://minio:9000"
    storage_public_endpoint_url: str = "http://localhost:9000"
    storage_access_key: SecretStr = SecretStr("jahan_minio")
    storage_secret_key: SecretStr = SecretStr("jahan_minio_change_me")
    storage_region: str = "us-east-1"
    media_quarantine_bucket: str = "jahan-quarantine"
    media_public_bucket: str = "jahan-public"
    media_upload_expiry_seconds: int = Field(default=900, ge=60, le=3600)
    media_download_expiry_seconds: int = Field(default=300, ge=60, le=3600)
    media_max_image_bytes: int = Field(default=15 * 1024 * 1024, ge=1024)
    media_max_logo_bytes: int = Field(default=5 * 1024 * 1024, ge=1024)
    media_max_public_file_bytes: int = Field(default=25 * 1024 * 1024, ge=1024)
    media_max_image_pixels: int = Field(default=40_000_000, ge=1_000_000)
    malware_scan_enabled: bool = True
    clamav_host: str = "clamav"
    clamav_port: int = Field(default=3310, ge=1, le=65535)
    clamav_timeout_seconds: float = Field(default=15.0, gt=0, le=120)

    @model_validator(mode="after")
    def validate_session_limits(self) -> "Settings":
        if self.session_idle_minutes > self.session_absolute_hours * 60:
            raise ValueError("Session idle timeout must not exceed its absolute lifetime")
        if self.staff_session_idle_minutes > self.staff_session_absolute_hours * 60:
            raise ValueError("Staff idle timeout must not exceed its absolute lifetime")
        if (
            self.staff_session_idle_minutes > self.session_idle_minutes
            or self.staff_session_absolute_hours > self.session_absolute_hours
        ):
            raise ValueError("Staff session limits must not be weaker than regular session limits")
        return self

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.environment == "production":
            if (
                self.session_secret.get_secret_value()
                == "local-only-change-me-at-least-32-characters"
            ):
                raise ValueError("JAHAN_SESSION_SECRET must not use the development default")
            if len(self.session_secret.get_secret_value()) < 32:
                raise ValueError("JAHAN_SESSION_SECRET must contain at least 32 characters")
            if not self.cookie_secure:
                raise ValueError("JAHAN_COOKIE_SECURE must be true in production")
            if self.monitoring_token is None or len(self.monitoring_token.get_secret_value()) < 32:
                raise ValueError("JAHAN_MONITORING_TOKEN must contain at least 32 characters")
            if self.trusted_proxy_secret and len(self.trusted_proxy_secret.get_secret_value()) < 32:
                raise ValueError("JAHAN_TRUSTED_PROXY_SECRET must contain at least 32 characters")
            if self.email_delivery_enabled and (
                self.smtp_host in {"localhost", "127.0.0.1"}
                or not (self.smtp_start_tls or self.smtp_use_tls)
            ):
                raise ValueError(
                    "Configure a TLS SMTP service or set JAHAN_EMAIL_DELIVERY_ENABLED=false"
                )
        if self.smtp_start_tls and self.smtp_use_tls:
            raise ValueError("Select SMTP STARTTLS or implicit TLS, not both")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
