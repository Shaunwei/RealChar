"""Change message schema to unicode

Revision ID: 27fe156a6d72
Revises: 9ed6d1431c1d
Create Date: 2023-07-18 22:32:03.388403

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '27fe156a6d72'
down_revision = '9ed6d1431c1d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('interactions', sa.Column(
        'client_message_unicode', sa.Unicode(65535)))
    op.add_column('interactions', sa.Column(
        'server_message_unicode', sa.Unicode(65535)))


def downgrade() -> None:
    op.drop_column('interactions', 'client_message_unicode')
    op.drop_column('interactions', 'server_message_unicode')
