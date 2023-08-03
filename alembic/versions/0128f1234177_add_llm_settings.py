"""Add LLM Config column

Revision ID: 0128f1234177
Revises: 5df1c3818f70
Create Date: 2023-08-02 16:11:38.028171

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0128f1234177'
down_revision = '5df1c3818f70'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('interactions', sa.Column('llm_config', sa.JSON(), nullable=True))



def downgrade() -> None:
    op.drop_column('interactions', 'llm_config')
