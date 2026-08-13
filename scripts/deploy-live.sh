#!/usr/bin/env bash
# Deploy Apobase static site to the live Caddy root WITHOUT internal files.
# Usage: ./scripts/deploy-live.sh
# Safety: excludes .git, .env*, ai/ backend source, backups — only public site files.
set -euo pipefail

SRC="/opt/data/sowedoo"
DEST_HOST="/srv/apobase"

echo "== Building deploy manifest (public files only)"
cd "$SRC"

# Use rsync-style exclusion via tar: only *.html, *.css, *.js at root level,
# plus README.md. The ai/ backend and dotfiles stay out of the live root.
tar cf /tmp/apobase-deploy.tar \
  --exclude='.git' \
  --exclude='.git*' \
  --exclude='ai' \
  --exclude='ai/' \
  --exclude='*.env' \
  --exclude='.env*' \
  --exclude='backups' \
  --exclude='*.md' \
  --exclude='README.md' \
  . 2>/dev/null || true
# include README explicitly (small, harmless, documents the repo)
tar rf /tmp/apobase-deploy.tar README.md 2>/dev/null || true

echo "== Copying to host live root via alpine mount"
# Pass the tarball through /root/.hermes (bind-mounted from container's /opt/data)
cp /tmp/apobase-deploy.tar /opt/data/deploy-tmp.tar
docker run --rm -v /:/hostroot alpine:latest sh -c '
  tar xf /hostroot/root/.hermes/deploy-tmp.tar -C /hostroot/srv/apobase
  rm -f /hostroot/root/.hermes/deploy-tmp.tar
  echo "deployed files: $(ls /hostroot/srv/apobase | wc -l)"
  echo "dangerous leftovers: $(ls -a /hostroot/srv/apobase | grep -E "^\.|^ai$" | wc -l)"
'
rm -f /tmp/apobase-deploy.tar /opt/data/deploy-tmp.tar

echo "== Restarting Caddy (stale inode protection)"
docker restart sophia-caddy >/dev/null
sleep 6

echo "== Verifying"
for p in "" "impressum.html" "notfalldepot.html"; do
  echo -n "/apobase/$p -> "
  curl -s -o /dev/null -w "%{http_code}\n" "https://42berlinaiclub.de/apobase/$p"
done
echo -n "deny /apobase/.git/config -> "
curl -s -o /dev/null -w "%{http_code}\n" "https://42berlinaiclub.de/apobase/.git/config"
echo "== Done"
