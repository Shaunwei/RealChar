"""Rename memories table

Revision ID: 6a306e613100
Revises: ed4f07e2e353
Create Date: 2023-08-14 17:04:12.687730

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '6a306e613100'
down_revision = 'ed4f07e2e353'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename memories table to quivr_info
    op.rename_table('memories', 'quivr_info')


def downgrade() -> None:
    op.rename_table('quivr_info', 'memories')
