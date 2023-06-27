"""Added interaction table

Revision ID: 0f355a71adbb
Revises: ead242c61258
Create Date: 2023-06-26 22:07:19.624594

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0f355a71adbb'
down_revision = 'ead242c61258'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('interactions',
                    sa.Column('id', sa.Integer(),
                              primary_key=True, index=True),
                    sa.Column('client_id', sa.Integer(), nullable=True),
                    sa.Column('client_message', sa.String(), nullable=True),
                    sa.Column('server_message', sa.String(), nullable=True),
                    sa.Column('timestamp', sa.DateTime(), nullable=True),
                    sa.PrimaryKeyConstraint('id')
                    )


def downgrade() -> None:
    op.drop_table('interactions')
