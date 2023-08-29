"""Add long term memory table

Revision ID: 3165d5c2a401
Revises: 209a70fa64cf
Create Date: 2023-08-23 11:55:48.788640

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3165d5c2a401'
down_revision = '209a70fa64cf'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'memory',
        sa.Column('memory_id', sa.String(64), primary_key=True),
        sa.Column('user_id', sa.String(50), nullable=True),
        sa.Column('source_session_id', sa.String(50), nullable=True),
        sa.Column('content', sa.Unicode(65535), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('memory')
