import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    # bcrypt silently truncates anything past 72 bytes, so cap here rather
    # than let two long-but-different passwords collide on the same hash.
    password: str = Field(min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=72)


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str | None
    telegram_id: int | None
    currency: str
    opening_balance_cents: int
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UpdateMeRequest(BaseModel):
    email: EmailStr | None = None
    currency: str | None = Field(None, min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")
    opening_balance_cents: int | None = None


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(max_length=72)
    new_password: str = Field(min_length=8, max_length=72)
