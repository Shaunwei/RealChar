"""Add message ID column

Revision ID: ea261c6173ce
Revises: 523fdfc40626
Create Date: 2023-07-31 22:16:58.581115

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ea261c6173ce'
down_revision = '523fdfc40626'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('interactions', sa.Column(
        'message_id', sa.String(16), nullable=True))


def downgrade() -> None:
    op.drop_column('interactions', 'message_id')
