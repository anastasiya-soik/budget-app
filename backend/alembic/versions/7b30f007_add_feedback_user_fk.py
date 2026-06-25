"""add_feedback_user_fk

Revision ID: 7b30f007
Revises: 7b30f006
Create Date: 2026-06-24
"""

import sqlalchemy as sa
from alembic import op

revision = "7b30f007"
down_revision = "7b30f006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_foreign_key(
        "fk_feedback_user_id",
        "feedback",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_feedback_user_id", "feedback", type_="foreignkey")
