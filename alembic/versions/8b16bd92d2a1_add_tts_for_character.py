"""Add TTS for character

Revision ID: 8b16bd92d2a1
Revises: 565747ade2c0
Create Date: 2023-08-08 12:10:53.437228

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8b16bd92d2a1'
down_revision = '565747ade2c0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('characters', sa.Column(
        'tts', sa.String(64), nullable=True))



def downgrade() -> None:
    op.drop_column('characters', 'tts')
