#!/bin/sh
set -eu
source_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
test -f "$source_dir/.next/standalone/server.js"
release_dir="/srv/ask-for-a-date/releases/$(date -u +%Y%m%dT%H%M%SZ)"
previous=$(readlink /srv/ask-for-a-date/current 2>/dev/null || true)
install -d -m 755 "$release_dir"
cp -a "$source_dir/.next/standalone/." "$release_dir/"
install -d -m 755 "$release_dir/public" "$release_dir/.next/static"
# The tracer may already include a public directory. Copy its CONTENTS.
cp -a "$source_dir/public/." "$release_dir/public/"
cp -a "$source_dir/.next/static/." "$release_dir/.next/static/"
# Runtime credentials are supplied by systemd, never shipped in a release.
find "$release_dir" -maxdepth 1 -type f -name '.env*' -delete
chmod -R a+rX "$release_dir"
ln -s "$release_dir" /srv/ask-for-a-date/current.next
mv -Tf /srv/ask-for-a-date/current.next /srv/ask-for-a-date/current
systemctl restart ask-for-a-date.service
if ! curl --fail --retry 5 --retry-connrefused --retry-delay 1 --max-time 15 --silent --output /dev/null http://127.0.0.1:3217/; then
    if [ -n "$previous" ]; then
        ln -s "$previous" /srv/ask-for-a-date/current.rollback
        mv -Tf /srv/ask-for-a-date/current.rollback /srv/ask-for-a-date/current
        systemctl restart ask-for-a-date.service
    fi
    echo 'Release failed its health check; restored the previous release.' >&2
    exit 1
fi
echo "Published $release_dir"
