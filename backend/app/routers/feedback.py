import asyncio
import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.limiter import limiter
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackOut
from app.services.telegram_service import send_message

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

    # Send to Telegram if admin is configured
    if settings.ADMIN_TELEGRAM_ID:
        if current_user.telegram_id:
            email = current_user.email or f"tg:{current_user.telegram_id}"
        else:
            email = current_user.email or "unknown"
        device = body.user_agent or "unknown device"
        msg = f"📨 Feedback from {email}\n\n{body.message}\n\n📱 {device}"
        asyncio.create_task(send_message(settings.ADMIN_TELEGRAM_ID, msg))

    return fb
