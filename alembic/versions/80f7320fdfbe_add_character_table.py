"""Add character table

Revision ID: 80f7320fdfbe
Revises: 523fdfc40626
Create Date: 2023-08-01 22:59:17.145599

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '80f7320fdfbe'
down_revision = '523fdfc40626'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'characters',
        sa.Column('id', sa.String(100), primary_key=True),
        sa.Column('name', sa.String(1024), nullable=False),
        sa.Column('system_prompt', sa.String(262144), nullable=True),
        sa.Column('user_prompt', sa.String(262144), nullable=True),
        sa.Column('text_to_speech_use', sa.String(100), nullable=True),
        sa.Column('voice_id', sa.String(100), nullable=True),
        sa.Column('author_id', sa.String(100), nullable=True),
        sa.Column('visibility', sa.String(100), nullable=True),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('characters')
