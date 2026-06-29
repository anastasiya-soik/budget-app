import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.limiter import limiter
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackOut, status_code=201)
@limiter.limit("10/minute")
async def send_feedback(
    request: Request,
    body: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fb = Feedback(
        user_id=current_user.id,
        message=body.message,
        user_agent=body.user_agent,
    )
    db.add(fb)
    await db.commit()
    await db.refresh(fb)
    logger.info(
        "Feedback from user %s (agent: %s): %s",
        current_user.id,
        body.user_agent or "unknown",
        body.message,
    )
    return fb
