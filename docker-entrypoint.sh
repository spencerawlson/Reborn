#!/bin/sh
# Apply pending database migrations, then start the web server.
set -e
node scripts/migrate.mts
exec node server.js
