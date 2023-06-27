"""Added user table

Revision ID: ead242c61258
Revises: 
Create Date: 2023-06-26 16:25:00.614978

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ead242c61258'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('users',
                    sa.Column('id', sa.Integer(), primary_key=True),
                    sa.Column('name', sa.String(), nullable=True),
                    sa.Column('email', sa.String(),
                              nullable=False, unique=True),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
