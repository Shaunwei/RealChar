"""Add Avatar_id to Characters

Revision ID: 209a70fa64cf
Revises: 6a306e613100
Create Date: 2023-08-16 13:05:55.840300

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '209a70fa64cf'
down_revision = '6a306e613100'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('characters', sa.Column('avatar_id', sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column('characters', 'avatar_id')
