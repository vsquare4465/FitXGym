#!/bin/sh
# Saves a database copy on the server. Run from the project folder.
set -e
cd "$(dirname "$0")/.."
mkdir -p backups
stamp=$(date +%F)
docker compose --env-file deploy/.env -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U fitx fitxgym > "backups/fitx-$stamp.sql"
echo "Wrote backups/fitx-$stamp.sql"
