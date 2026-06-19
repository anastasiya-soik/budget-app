"""create_feedback

Revision ID: 7b30f006
Revises: 7b30f005
Create Date: 2026-06-19
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "7b30f006"
down_revision = "7b30f005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "feedback",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_feedback_user_id", "feedback", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_feedback_user_id", table_name="feedback")
    op.drop_table("feedback")
