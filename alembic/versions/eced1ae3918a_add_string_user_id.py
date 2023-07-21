"""Add string user ID

Revision ID: eced1ae3918a
Revises: 3821f7adaca9
Create Date: 2023-07-19 11:02:52.002939

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'eced1ae3918a'
down_revision = '3821f7adaca9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('interactions', sa.Column(
        'user_id', sa.String(50), nullable=True))

    # Populate the new column with the old column's data
    op.execute("""
    UPDATE interactions
    SET user_id = CAST(client_id AS TEXT)
    """)

    # TODO: make the user_id column non-nullable after prod migration.
    # Skip for now given production servers are distributed. Note this is not
    # relevant if you deploy locally.


def downgrade() -> None:
    op.drop_column('interactions', 'user_id')
