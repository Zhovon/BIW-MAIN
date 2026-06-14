from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

engine = None
SessionLocal = None

if settings.database_url:
    database_url = settings.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    engine = create_engine(
        database_url,
        poolclass=NullPool,  # Required for serverless — no persistent pool
    )

    @event.listens_for(engine, "connect")
    def disable_prepared_statements(dbapi_connection, connection_record):
        if hasattr(dbapi_connection, "prepare_threshold"):
            dbapi_connection.prepare_threshold = None

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
