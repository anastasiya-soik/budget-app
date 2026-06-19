from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class FeedbackOut(BaseModel):
    id: str
    message: str

    model_config = {"from_attributes": True}
