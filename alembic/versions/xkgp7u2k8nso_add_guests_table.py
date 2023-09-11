"""Add guests table

Revision ID: xkgp7u2k8nso
Revises: 3165d5c2a401
Create Date: 2023-09-07 12:50:09.063471

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'xkgp7u2k8nso'
down_revision = '3165d5c2a401'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('guests_test',
                    sa.Column('name', sa.String(), primary_key=True),
                    sa.Column('email', sa.String()),
                    sa.PrimaryKeyConstraint('name')
                    )


def downgrade() -> None:
    op.drop_table('guests_test')