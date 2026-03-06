#!/bin/sh
set -eu

mkdir -p /usr/share/nginx/html/config

cat <<EOF >/usr/share/nginx/html/config/runtime-config.json
{
  "defaultDrawingUrl": "${DEFAULT_DRAWING_URL:-/sample-drawing.pdf}"
}
EOF
