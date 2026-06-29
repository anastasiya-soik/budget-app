"""Add user_agent to feedback table.

Revision ID: 7b30f009_add_user_agent_to_feedback
Revises: 7b30f008_add_opening_balance
Create Date: 2026-06-25 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "7b30f009_add_user_agent_to_feedback"
down_revision = "7b30f008_add_opening_balance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("feedback", sa.Column("user_agent", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("feedback", "user_agent")
