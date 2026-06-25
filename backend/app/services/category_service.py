import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category

logger = logging.getLogger(__name__)

MAX_CATEGORIES_PER_USER = 50

DEFAULT_CATEGORIES = [
    {"name": "Food", "color": "#E52B50", "type": "expense"},
    {"name": "Transport", "color": "#64A0FF", "type": "expense"},
    {"name": "Housing", "color": "#AA40FF", "type": "expense"},
    {"name": "Health", "color": "#10b981", "type": "expense"},
    {"name": "Entertainment", "color": "#E8A020", "type": "expense"},
    {"name": "Shopping", "color": "#2060D0", "type": "expense"},
    {"name": "Salary", "color": "#059669", "type": "income"},
    {"name": "Freelance", "color": "#0891B2", "type": "income"},
]


async def create_defaults(user_id: uuid.UUID, db: AsyncSession) -> None:
    for cat in DEFAULT_CATEGORIES:
        db.add(Category(user_id=user_id, name=cat["name"], color=cat["color"], type=cat["type"]))


async def seed_defaults(user_id: uuid.UUID, db: AsyncSession) -> list[Category]:
    count_result = await db.execute(
        select(func.count()).select_from(Category).where(Category.user_id == user_id)
    )
    if count_result.scalar_one() > 0:
        return []
    await create_defaults(user_id, db)
    await db.commit()
    result = await db.execute(
        select(Category).where(Category.user_id == user_id).order_by(Category.created_at)
    )
    return list(result.scalars().all())


async def get_all(user_id: uuid.UUID, db: AsyncSession) -> list[Category]:
    result = await db.execute(
        select(Category)
        .where(Category.user_id == user_id)
        .order_by(Category.created_at)
    )
    return list(result.scalars().all())


async def create(
    user_id: uuid.UUID,
    name: str,
    color: str,
    type_: str,
    db: AsyncSession,
) -> Category:
    count_result = await db.execute(
        select(func.count()).select_from(Category).where(Category.user_id == user_id)
    )
    if count_result.scalar_one() >= MAX_CATEGORIES_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 50 categories reached",
        )

    category = Category(user_id=user_id, name=name, color=color, type=type_)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def update(
    category_id: uuid.UUID,
    user_id: uuid.UUID,
    name: str | None,
    color: str | None,
    type_: str | None,
    db: AsyncSession,
) -> Category:
    result = await db.execute(
        select(Category).where(
            Category.id == category_id,
            Category.user_id == user_id,
        )
    )
    category = result.scalar_one_or_none()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if name is not None:
        category.name = name
    if color is not None:
        category.color = color
    if type_ is not None:
        category.type = type_

    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def delete(
    category_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    result = await db.execute(
        select(Category).where(
            Category.id == category_id,
            Category.user_id == user_id,
        )
    )
    category = result.scalar_one_or_none()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    await db.delete(category)
    await db.commit()
