import uuid

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    user_agent: str | None = None


class FeedbackOut(BaseModel):
    id: uuid.UUID
    message: str
    user_agent: str | None

    model_config = {"from_attributes": True}
