import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://copywriting:agent@localhost:5432/copywriting_agent_db"
)

engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,     # 사용 전 커넥션 생존 여부 확인 (stale 커넥션 방지)
    pool_recycle=300,        # 5분 이상 유휴 커넥션 자동 재생성
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Migrate: add new columns to existing campaigns table if missing
        await conn.execute(
            __import__('sqlalchemy').text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='current_step') THEN
                        ALTER TABLE campaigns ADD COLUMN current_step SMALLINT NOT NULL DEFAULT 1;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='updated_at') THEN
                        ALTER TABLE campaigns ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='copy_candidates') THEN
                        ALTER TABLE campaigns ADD COLUMN copy_candidates JSONB;
                    END IF;
                    -- Make previously NOT NULL columns nullable for partial saves
                    ALTER TABLE campaigns ALTER COLUMN analysis_report DROP NOT NULL;
                    ALTER TABLE campaigns ALTER COLUMN strategic_message DROP NOT NULL;
                    ALTER TABLE campaigns ALTER COLUMN copy_results DROP NOT NULL;
                END $$;
            """)
        )


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
