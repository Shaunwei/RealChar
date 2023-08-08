"""Add memory table

Revision ID: 670c73f6bddf
Revises: 565747ade2c0
Create Date: 2023-08-07 21:10:22.291167

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '670c73f6bddf'
down_revision = '565747ade2c0'
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
