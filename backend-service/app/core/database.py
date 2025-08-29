"""
Database configuration and connection management
"""

import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import MetaData
import redis.asyncio as redis
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Database engine and session
engine = None
AsyncSessionLocal = None
redis_client = None

# Base class for models
Base = declarative_base()

# Metadata for migrations
metadata = MetaData()


async def init_db() -> None:
    """Initialize database connections"""
    global engine, AsyncSessionLocal, redis_client
    
    try:
        # Initialize PostgreSQL
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG,
            pool_pre_ping=True,
            pool_recycle=300,
        )
        
        AsyncSessionLocal = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        # Test database connection
        async with engine.begin() as conn:
            await conn.run_sync(lambda sync_conn: sync_conn.execute("SELECT 1"))
        
        logger.info("PostgreSQL database initialized successfully")
        
        # Initialize Redis
        redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        
        # Test Redis connection
        await redis_client.ping()
        logger.info("Redis connection established successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


async def close_db() -> None:
    """Close database connections"""
    global engine, redis_client
    
    if engine:
        await engine.dispose()
        logger.info("PostgreSQL connections closed")
    
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed")


@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Database session dependency"""
    if not AsyncSessionLocal:
        raise RuntimeError("Database not initialized")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_redis() -> redis.Redis:
    """Redis client dependency"""
    if not redis_client:
        raise RuntimeError("Redis not initialized")
    return redis_client
