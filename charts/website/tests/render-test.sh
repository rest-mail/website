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
has "appVersion by default" "$tmp/plain.yaml" "ghcr.io/rest-mail/website:0.12.2"
helm template website "$CHART_DIR" --set image.tag=9.9.9 > "$tmp/pinned.yaml"
has "an explicit tag"       "$tmp/pinned.yaml" "ghcr.io/rest-mail/website:9.9.9"

echo "== which design is live =="
has "safe by default" "$tmp/plain.yaml" 'value: "safe"'
helm template website "$CHART_DIR" --set design=bold > "$tmp/bold.yaml"
has "another when asked"      "$tmp/bold.yaml" 'value: "bold"'
if helm template website "$CHART_DIR" --set design=fancy > /dev/null 2>&1; then
  fail "expected a design that does not exist to be refused"
fi
pass "a design that does not exist is refused"

echo "== where people write to the project =="
has "hello@ by default" "$tmp/plain.yaml" 'value: "hello@rest-mail.com"'
helm template website "$CHART_DIR" --set contact=privacy@example.org > "$tmp/contact.yaml"
has "another when asked" "$tmp/contact.yaml" 'value: "privacy@example.org"'
# --set-string splits on commas unless they are escaped, hence the \, below.
for bad in "nobody" "two words@example.org" "a@b" 'x@example.org\,y@example.org' "x@example.org>"; do
  if helm template website "$CHART_DIR" --set-string "contact=$bad" > "$tmp/bad.out" 2>&1; then
    fail "expected a contact that is not an address to be refused: $bad"
  fi
  grep -Fq "contact must be an email address" "$tmp/bad.out" || fail "refused for another reason: $bad: $(head -1 "$tmp/bad.out")"
done
pass "a contact that is not an address is refused"

echo "== a Node server, unprivileged =="
has "listens on 3000"         "$tmp/plain.yaml" "containerPort: 3000"
has "told its port"           "$tmp/plain.yaml" 'value: "3000"'
has "never root"              "$tmp/plain.yaml" "runAsNonRoot: true"
has "as the image's user"     "$tmp/plain.yaml" "runAsUser: 1000"
has "a read-only filesystem"  "$tmp/plain.yaml" "readOnlyRootFilesystem: true"
hasnt "no capabilities added" "$tmp/plain.yaml" "add:"
has "ready when / renders"    "$tmp/plain.yaml" "httpGet: { path: /, port: http }"
has "alive while it answers"  "$tmp/plain.yaml" "httpGet: { path: /healthz, port: http }"

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
