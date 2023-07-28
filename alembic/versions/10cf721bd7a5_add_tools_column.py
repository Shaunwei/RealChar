"""Add tools column

Revision ID: 10cf721bd7a5
Revises: 42a5deca5cd3
Create Date: 2023-07-27 22:15:11.913084

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '10cf721bd7a5'
down_revision = '42a5deca5cd3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('interactions', sa.Column(
        'tools', sa.String(100), nullable=True))

def downgrade() -> None:
    op.drop_column('interactions', 'tools')
