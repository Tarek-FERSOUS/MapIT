#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  sudo ./deploy/scripts/install-vm-services.sh --role api --repo /opt/mapit
  sudo ./deploy/scripts/install-vm-services.sh --role web --repo /opt/mapit

Options:
  --role    api | web
  --repo    Absolute path to repo root (default: /opt/mapit)
  --user    Service user (default: mapit)
EOF
}

ROLE=""
REPO="/opt/mapit"
SVC_USER="mapit"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --role)
      ROLE="${2:-}"
      shift 2
      ;;
    --repo)
      REPO="${2:-}"
      shift 2
      ;;
    --user)
      SVC_USER="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$ROLE" ]]; then
  echo "--role is required"
  usage
  exit 1
fi

if [[ "$EUID" -ne 0 ]]; then
  echo "Run as root (sudo)."
  exit 1
fi

if [[ ! -d "$REPO" ]]; then
  echo "Repo path does not exist: $REPO"
  exit 1
fi

if ! id -u "$SVC_USER" >/dev/null 2>&1; then
  useradd --system --create-home --shell /usr/sbin/nologin "$SVC_USER"
fi

chown -R "$SVC_USER:$SVC_USER" "$REPO"

install_api() {
  echo "Installing API systemd service..."
  cp "$REPO/deploy/systemd/mapit-api.service" /etc/systemd/system/mapit-api.service
  systemctl daemon-reload
  systemctl enable mapit-api
  systemctl restart mapit-api
  systemctl status mapit-api --no-pager
}

install_web() {
  echo "Installing WEB systemd service..."
  cp "$REPO/deploy/systemd/mapit-web.service" /etc/systemd/system/mapit-web.service

  echo "Installing Nginx..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y nginx
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y nginx
  elif command -v yum >/dev/null 2>&1; then
    yum install -y nginx
  else
    echo "No supported package manager found for nginx install."
    exit 1
  fi

  mkdir -p /etc/nginx/sites-available
  mkdir -p /etc/nginx/sites-enabled
  cp "$REPO/deploy/nginx/mapit-web.conf" /etc/nginx/sites-available/mapit-web.conf
  ln -sf /etc/nginx/sites-available/mapit-web.conf /etc/nginx/sites-enabled/mapit-web.conf
  nginx -t

  systemctl enable nginx
  systemctl restart nginx

  systemctl daemon-reload
  systemctl enable mapit-web
  systemctl restart mapit-web
  systemctl status mapit-web --no-pager
}

case "$ROLE" in
  api)
    install_api
    ;;
  web)
    install_web
    ;;
  *)
    echo "Invalid role: $ROLE"
    usage
    exit 1
    ;;
esac

echo "Done."
