#!/usr/bin/env bash
# What the chart must still produce. Run by .github/workflows/chart.yml before
# anything is published, so a chart that cannot be installed is never offered.
set -euo pipefail
CHART_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "ok: $*"; }
has() { grep -Fq -- "$3" "$2" || fail "$1 (expected: $3)"; pass "$1"; }
hasnt() { ! grep -Fq -- "$3" "$2" || fail "$1 (unexpected: $3)"; pass "$1"; }

helm lint "$CHART_DIR" > /dev/null || fail "lint"
pass "lints"

echo "== the site, with no ingress =="
helm template website "$CHART_DIR" > "$tmp/plain.yaml"
has   "deployment"        "$tmp/plain.yaml" "kind: Deployment"
has   "service"           "$tmp/plain.yaml" "kind: Service"
hasnt "no ingress by default" "$tmp/plain.yaml" "kind: Ingress"

echo "== the image is pinned where it is asked to be =="
has "appVersion by default" "$tmp/plain.yaml" "ghcr.io/rest-mail/website:0.1.0"
helm template website "$CHART_DIR" --set image.tag=0.2.0 > "$tmp/pinned.yaml"
has "an explicit tag"       "$tmp/pinned.yaml" "ghcr.io/rest-mail/website:0.2.0"

echo "== the names the site answers to =="
helm template website "$CHART_DIR" --set ingress.enabled=true \
  --set 'ingress.hosts={rest-mail.com,www.rest-mail.com}' \
  --set ingress.className=traefik \
  --set ingress.tls.enabled=true --set ingress.tls.secretName=website-tls > "$tmp/ingress.yaml"
has "ingress"        "$tmp/ingress.yaml" "kind: Ingress"
has "the apex"       "$tmp/ingress.yaml" 'host: "rest-mail.com"'
has "www"            "$tmp/ingress.yaml" 'host: "www.rest-mail.com"'
has "its certificate" "$tmp/ingress.yaml" "secretName: website-tls"

# An ingress for no name would be an ingress nobody reaches, and TLS with no
# certificate is an ingress that cannot serve: say so at render instead.
if helm template website "$CHART_DIR" --set ingress.enabled=true > /dev/null 2>&1; then
  fail "expected an ingress with no hosts to be refused"
fi
pass "an ingress with no hosts is refused"
if helm template website "$CHART_DIR" --set ingress.enabled=true \
     --set 'ingress.hosts={rest-mail.com}' --set ingress.tls.enabled=true > /dev/null 2>&1; then
  fail "expected TLS with no secret to be refused"
fi
pass "TLS with no secret is refused"

echo
echo "All website chart render tests passed."
