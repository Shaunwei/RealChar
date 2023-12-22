"""Add embedding column

Revision ID: 165551ce57c6
Revises: 3165d5c2a401
Create Date: 2023-08-23 15:23:43.680607

"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision = '165551ce57c6'
down_revision = '3165d5c2a401'
branch_labels = None
depends_on = None


def upgrade() -> None:
    if op.get_bind().dialect.name == 'postgresql':
        op.add_column('memory', sa.Column('content_embedding', Vector(1536)))


def downgrade() -> None:
    if op.get_bind().dialect.name == 'postgresql':
        op.drop_column('memory', 'content_embedding')
