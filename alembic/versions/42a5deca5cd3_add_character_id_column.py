"""Add character ID column

Revision ID: 42a5deca5cd3
Revises: eced1ae3918a
Create Date: 2023-07-26 13:05:02.181846

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '42a5deca5cd3'
down_revision = 'eced1ae3918a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('interactions', sa.Column(
        'character_id', sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column('interactions', 'character_id')
