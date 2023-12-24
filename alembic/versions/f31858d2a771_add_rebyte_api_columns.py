"""Add rebyte_api columns

Revision ID: f31858d2a771
Revises: c3ba7d5037ea
Create Date: 2023-12-13 15:02:07.612393

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f31858d2a771'
down_revision = 'c3ba7d5037ea'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('characters', sa.Column('rebyte_api_project_id', sa.String(length=100), nullable=True))
    op.add_column('characters', sa.Column('rebyte_api_agent_id', sa.String(length=100), nullable=True))
    op.add_column('characters', sa.Column('rebyte_api_version', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('characters', 'rebyte_api_version')
    op.drop_column('characters', 'rebyte_api_agent_id')
    op.drop_column('characters', 'rebyte_api_project_id')
