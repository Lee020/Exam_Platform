#!/usr/bin/env bash
set -euo pipefail

# start_local.sh - single-command local dev starter for Exam_Platform
# - installs Python requirements to user site (no sudo)
# - uses SQLite fallback (USE_SQLITE=True)
# - runs migrations
# - creates default roles and a dev superuser if not present
# - starts Django dev server in background and writes logs to backend_run.log

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "[start_local] repo root: $REPO_ROOT"

# Check Python
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found. Install Python 3.10+ and retry." >&2
  exit 1
fi

# Ensure pip is available
if ! python3 -m pip --version >/dev/null 2>&1; then
  echo "pip for python3 not found. Please install pip for python3." >&2
  exit 1
fi

# Install requirements to user site (avoids needing venv)
echo "[start_local] Installing Python packages to user site (~/.local). This may take a while..."
python3 -m pip install --user --upgrade pip setuptools wheel
python3 -m pip install --user -r backend/requirements.txt

# Ensure ~/.local/bin is in PATH for this session
export PATH="$HOME/.local/bin:$PATH"

# Use SQLite fallback so Postgres is not required
export USE_SQLITE=True

cd backend

echo "[start_local] Running migrations (SQLite)..."
python3 manage.py migrate --settings=config.settings

# Create default roles and a dev superuser if absent
SUPERUSER_USERNAME=${SUPERUSER_USERNAME:-admin}
SUPERUSER_EMAIL=${SUPERUSER_EMAIL:-admin@example.test}
SUPERUSER_PASSWORD=${SUPERUSER_PASSWORD:-adminpass}

echo "[start_local] Ensuring default roles & superuser (username=$SUPERUSER_USERNAME)"
TMP_PY="/tmp/ep_create_superuser.py"
cat > "$TMP_PY" <<'PY'
import os
from apps.users.models import Role, User

username = os.environ.get('SUPERUSER_USERNAME', 'admin')
email = os.environ.get('SUPERUSER_EMAIL', 'admin@example.test')
password = os.environ.get('SUPERUSER_PASSWORD', 'adminpass')

admin_role, _ = Role.objects.get_or_create(name='ADMIN', defaults={'description':'Administrator role'})
if not User.objects.filter(username=username).exists():
  user = User.objects.create_user(username=username, email=email, password=password, role=admin_role)
  user.is_admin = True
  user.is_superuser = True
  user.save()
  print('Created superuser', username)
else:
  print('Superuser exists')
PY

python3 manage.py shell --settings=config.settings < "$TMP_PY"
rm -f "$TMP_PY"

# Start server in background and log output
LOG_FILE="$REPO_ROOT/backend_run.log"
echo "[start_local] Starting Django development server; logs -> $LOG_FILE"
# Use nohup so the command stays running after this script exits
nohup python3 manage.py runserver 0.0.0.0:8000 --settings=config.settings > "$LOG_FILE" 2>&1 &
PID=$!
sleep 1
if ps -p $PID >/dev/null 2>&1; then
  echo "[start_local] Server started (pid=$PID). Visit http://127.0.0.1:8000"
  echo "[start_local] To stop the server: kill $PID"
  echo "[start_local] Logs: $LOG_FILE"
  exit 0
else
  echo "[start_local] Server failed to start. Check $LOG_FILE for details" >&2
  exit 2
fi
