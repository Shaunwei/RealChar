"""Add background text

Revision ID: c3ba7d5037ea
Revises: 8ad83bfb4a77
Create Date: 2023-10-05 18:01:05.529920

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'c3ba7d5037ea'
down_revision = '8ad83bfb4a77'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('characters', sa.Column('background_text', sa.String(262144), nullable=True))


def downgrade() -> None:
    op.drop_column('characters', 'background_text')

