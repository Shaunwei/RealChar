"""add platform and action types

Revision ID: 9ed6d1431c1d
Revises: 0f355a71adbb
Create Date: 2023-07-18 00:31:05.044828

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9ed6d1431c1d'
down_revision = '0f355a71adbb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('interactions', sa.Column(
        'platform', sa.String(50), nullable=True))
    op.add_column('interactions', sa.Column(
        'action_type', sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column('interactions', 'platform')
    op.drop_column('interactions', 'action_type')
