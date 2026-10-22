#!/usr/bin/env bash
# Full backend test run on a throw-away database. Run from anywhere:  bash backend/tests/run.sh
#   Needs: MySQL/MariaDB you can administer, Node 20+.  The frontend must be built (cd frontend && npm run build) for the SEO/XSS check.
#   Config via env (all optional):  MYSQL_CLI="mysql -uroot -pSECRET"   DB_NAME=techabhi_test   DB_USER/DB_PASSWORD/DB_HOST (what the server connects as; must have rights on DB_NAME)
set -u
cd "$(dirname "$0")/.."
export MYSQL_CLI=${MYSQL_CLI:-mysql -uroot}  DB_NAME=${DB_NAME:-techabhi_test}  DB_HOST=${DB_HOST:-127.0.0.1}  DB_USER=${DB_USER:-root}  DB_PASSWORD=${DB_PASSWORD:-}
PORT=${TEST_PORT:-4010}; MOCK_PORT=${MOCK_PORT:-4110}
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")
export API_URL="http://localhost:$PORT" UPLOAD_DIR="$(mktemp -d)" MOCK_PORT PUBLIC_URL="http://localhost:$PORT"
PIDS=()
cleanup() { for p in "${PIDS[@]:-}"; do kill "$p" 2>/dev/null; done; rm -rf "$UPLOAD_DIR"; }
trap cleanup EXIT
start_server() { PORT=$PORT "$@" node server.js >/tmp/techabhi-test-api.log 2>&1 & PIDS+=($!); for _ in $(seq 1 40); do curl -sf "$API_URL/api/health" >/dev/null && return 0; sleep 0.5; done; echo "server did not start:"; cat /tmp/techabhi-test-api.log; exit 1; }
stop_server() { kill "${PIDS[-1]}" 2>/dev/null; wait "${PIDS[-1]}" 2>/dev/null; unset 'PIDS[-1]'; }
[ -f ../frontend/dist/index.html ] || echo "NOTE: frontend/dist missing; the SEO/XSS check will be skipped."

echo "== resetting database $DB_NAME =="
$MYSQL_CLI -e "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME" || exit 1
for m in migrations/*.sql; do $MYSQL_CLI "$DB_NAME" < "$m" || { echo "migration failed: $m"; exit 1; }; done
node scripts/createAdmin.js admin@test.com "longpassword123" >/dev/null || exit 1

FAILED=0; run() { out=$(node "$2" 2>&1); echo "$1: $(echo "$out" | grep -E 'passed' | tail -1)"; echo "$out" | grep -E '^FAIL' ; echo "$out" | grep -qE ', 0 failed' || FAILED=1; }
start_server env -u GEMINI_API_KEY;                                           run "phase 1 (public site, admin publishing)" tests/phase1.test.mjs; stop_server
node tests/mock-gemini.mjs & PIDS+=($!); sleep 1
start_server env GEMINI_API_KEY=test GEMINI_API_BASE="http://127.0.0.1:$MOCK_PORT/v1beta"
run "phase 2 (candidates, resume, saved, tracker)" tests/phase2.test.mjs
run "phase 3 (recruiters, applications)" tests/phase3.test.mjs
run "phase 4 (career assistance)" tests/phase4.test.mjs; stop_server
start_server env -u GEMINI_API_KEY;                                           run "security (fresh server so rate limits start clean)" tests/security.test.mjs
echo; [ $FAILED = 0 ] && echo "ALL BACKEND SUITES PASSED" || { echo "SOME SUITES FAILED"; exit 1; }
