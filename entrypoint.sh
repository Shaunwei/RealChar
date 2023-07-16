#!/bin/sh
set -e
alembic upgrade head
uvicorn realtime_ai_character.main:app --host 0.0.0.0
