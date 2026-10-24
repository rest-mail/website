#!/usr/bin/env bash
# Runs a workflow of this repository at a ref, and waits for that run to end;
# exits non-zero unless it succeeded. The release workflow uses it because
# what its own token pushes starts no workflow by itself.
#
#   scripts/dispatch-and-wait.sh <workflow file> <ref>
#
# Needs GH_TOKEN with actions: write, and GITHUB_REPOSITORY.
set -euo pipefail
workflow=$1 ref=$2
since=$(date -u +%Y-%m-%dT%H:%M:%SZ)
gh workflow run "$workflow" --repo "$GITHUB_REPOSITORY" --ref "$ref"
run=""
for _ in $(seq 1 40); do
  sleep 6
  run=$(gh run list --repo "$GITHUB_REPOSITORY" --workflow "$workflow" --event workflow_dispatch --branch "$ref" \
    --json databaseId,createdAt --jq "map(select(.createdAt >= \"$since\")) | .[0].databaseId // empty")
  [ -n "$run" ] && break
done
[ -n "$run" ] || { echo "::error::$workflow at $ref did not start" >&2; exit 1; }
echo "$workflow at $ref: $GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$run"
gh run watch "$run" --repo "$GITHUB_REPOSITORY" --exit-status --interval 30 > /dev/null
