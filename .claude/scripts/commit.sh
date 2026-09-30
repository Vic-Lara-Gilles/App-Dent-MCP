#!/usr/bin/env bash
# Adapted from ClipBoardApp for the DentAI pnpm workspace.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

survey() {
  git rev-parse --abbrev-ref HEAD
  git status --short --untracked-files=all
  git diff --stat HEAD
  git diff HEAD
  git ls-files --others --exclude-standard
  git diff --stat -M HEAD --diff-filter=R
}
staged() {
  git diff --cached --stat
  git diff --cached
}
run_gate() {
  local label=$1 log status
  shift
  log=$(mktemp "${TMPDIR:-/tmp}/dentai-gate.XXXXXX")
  if "$@" >"$log" 2>&1; then
    printf '%s passed (%s)\n' "$label" "$log"
  else
    status=$?
    printf '%s FAILED (exit %s); full output: %s\n' "$label" "$status" "$log"
    tail -60 "$log"
    return "$status"
  fi
}
verify() {
  run_gate lint pnpm exec eslint --max-warnings=0
  run_gate types pnpm typecheck
  run_gate unit-tests pnpm test
  run_gate app-build pnpm build
  run_gate mcp-build pnpm -C mcp-server build
}
verify_full() {
  if [ -z "${TEST_DATABASE_URL:-}" ]; then
    printf 'TEST_DATABASE_URL is required for integration verification\n' >&2
    return 1
  fi
  run_gate postgres-integration pnpm test:integration
}
report() {
  git status --short
  git log --oneline -"${1:-10}"
}
case "${1:-}" in
  survey) survey ;;
  staged) staged ;;
  verify) verify ;;
  verify-full) verify_full ;;
  report) report "${2:-10}" ;;
  *) printf 'usage: %s <survey|staged|verify|verify-full|report [n]>\n' "$0" >&2; exit 64 ;;
esac
