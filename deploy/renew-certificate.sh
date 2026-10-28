#!/bin/sh
set -eu
if [ "${RENEWED_LINEAGE:-}" = /etc/letsencrypt/live/ask-for-a-date.lorqina.ir ]; then
    /usr/sbin/nginx -t
    /bin/systemctl reload nginx
fi
