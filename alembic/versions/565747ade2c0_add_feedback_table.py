"""Add feedback table

Revision ID: 565747ade2c0
Revises: 0128f1234177
Create Date: 2023-08-02 15:33:10.614494

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '565747ade2c0'
down_revision = '0128f1234177'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'feedbacks',
        sa.Column('message_id', sa.String(64), primary_key=True),
        sa.Column('session_id', sa.String(50), nullable=True),
        sa.Column('user_id', sa.String(50), nullable=True),
        sa.Column('server_message_unicode', sa.Unicode(65535), nullable=True),
        sa.Column('feedback', sa.String(100), nullable=True),
        sa.Column('comment', sa.Unicode(65535), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

def downgrade() -> None:
    op.drop_table('feedbacks')
