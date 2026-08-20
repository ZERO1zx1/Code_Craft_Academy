from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CodeCraft Academy API"
    environment: str = "development"
    api_prefix: str = "/api"
    frontend_origin: str = "http://localhost:5500"
    cors_origins: str = ""
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_key: str = ""
    supabase_service_role_key: str = ""

    @property
    def public_supabase_key(self) -> str:
        """Only a Supabase publishable/anon key may be returned to a browser."""
        return self.supabase_anon_key or self.supabase_key

    @property
    def allowed_origins(self) -> list[str]:
        configured = [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]
        defaults = [self.frontend_origin.rstrip("/"), "http://127.0.0.1:5500", "http://localhost:3000"]
        return list(dict.fromkeys([*configured, *defaults]))

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

