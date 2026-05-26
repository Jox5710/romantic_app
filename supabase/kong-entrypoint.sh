#!/bin/bash
set -e
sed \
  -e "s|\${ANON_KEY}|${ANON_KEY}|g" \
  -e "s|\${SERVICE_ROLE_KEY}|${SERVICE_ROLE_KEY}|g" \
  /home/kong/temp.yml > /home/kong/kong.yml
exec /docker-entrypoint.sh kong docker-start
