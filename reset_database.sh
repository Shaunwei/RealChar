set -e
rm -r chroma.db test.db
sqlite3 test.db "VACUUM;"
alembic upgrade head