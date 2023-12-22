"""Add ANN index to pgvector column

Revision ID: 8ad83bfb4a77
Revises: 165551ce57c6
Create Date: 2023-08-31 12:42:06.979756

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '8ad83bfb4a77'
down_revision = '165551ce57c6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    if op.get_bind().dialect.name == 'postgresql':
        op.execute("""
            CREATE INDEX content_embedding_index ON memory
            USING ivfflat(content_embedding vector_cosine_ops)
            WITH (lists=100);
        """)


def downgrade() -> None:
    if op.get_bind().dialect.name == 'postgresql':
        op.drop_index('content_embedding_index', table_name='memory')
