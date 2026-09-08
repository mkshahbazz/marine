"""Typed environment configuration (pydantic-settings)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""
    port: int = 8000
    # comma-separated list — now only needs to include the GATEWAY's origin,
    # not the frontend's, since the gateway is the only thing calling this API
    cors_origins: str = "http://localhost:4000"


settings = Settings()
