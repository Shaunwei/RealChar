"""Add memory table

Revision ID: ed4f07e2e353
Revises: 8b16bd92d2a1
Create Date: 2023-08-08 21:40:45.626833

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ed4f07e2e353'
down_revision = '8b16bd92d2a1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('memories',
                    sa.Column('id', sa.Integer(),
                              primary_key=True, index=True),
                    sa.Column('user_id', sa.Integer(), nullable=True),
                    sa.Column('quivr_api_key', sa.String(), nullable=True),
                    sa.Column('quivr_brain_id', sa.String(), nullable=True),
                    sa.PrimaryKeyConstraint('id')
                    )


def downgrade() -> None:
    op.drop_table('memories')
