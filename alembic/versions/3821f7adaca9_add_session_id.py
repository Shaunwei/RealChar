"""Add session ID

Revision ID: 3821f7adaca9
Revises: 27fe156a6d72
Create Date: 2023-07-18 22:44:33.107380

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3821f7adaca9'
down_revision = '27fe156a6d72'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('interactions', sa.Column(
        'session_id', sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column('interactions', 'session_id')
