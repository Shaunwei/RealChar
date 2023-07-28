"""Add language column

Revision ID: 523fdfc40626
Revises: 10cf721bd7a5
Create Date: 2023-07-28 15:00:39.340331

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '523fdfc40626'
down_revision = '10cf721bd7a5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('interactions', sa.Column('language', sa.String(10), nullable=True))


def downgrade() -> None:
    op.drop_column('interactions', 'language')
