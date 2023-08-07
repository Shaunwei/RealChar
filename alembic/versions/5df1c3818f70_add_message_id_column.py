"""Add message ID column

Revision ID: 5df1c3818f70
Revises: 80f7320fdfbe
Create Date: 2023-08-02 14:14:19.863205

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5df1c3818f70'
down_revision = '80f7320fdfbe'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('interactions', sa.Column(
        'message_id', sa.String(64), nullable=True))


def downgrade() -> None:
    op.drop_column('interactions', 'message_id')
