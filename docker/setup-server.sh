#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Perú Calcula — Inicialización del servidor de producción (Ubuntu 22.04/24.04)
# Ejecutar una sola vez como root: bash setup-server.sh perucalcula.pe tu@email.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${1:?Uso: $0 <dominio> <email-letsencrypt>}"
EMAIL="${2:?Uso: $0 <dominio> <email-letsencrypt>}"
APP_DIR="/opt/peru-calcula"
DEPLOY_USER="deploy"

echo "▶  Configurando servidor para $DOMAIN"

# ── 1. Sistema base ───────────────────────────────────────────────────────────
apt-get update -qq
apt-get install -y -qq curl wget git unzip ufw fail2ban

# ── 2. Docker ─────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

# ── 3. Usuario deploy (sin sudo, solo docker) ─────────────────────────────────
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd --system --create-home --shell /bin/bash "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

# ── 4. Directorio de la app ───────────────────────────────────────────────────
mkdir -p "$APP_DIR"
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

# ── 5. Firewall ───────────────────────────────────────────────────────────────
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "   Firewall configurado (SSH + 80 + 443)"

# ── 6. Certbot (Let's Encrypt) ────────────────────────────────────────────────
apt-get install -y -qq certbot

# Primer certificado: modo standalone (antes de levantar nginx)
mkdir -p /var/www/certbot
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"
  echo "   Certificado SSL obtenido para $DOMAIN"
else
  echo "   Certificado SSL ya existe para $DOMAIN"
fi

# Renovación automática
cat > /etc/cron.d/certbot-renew << 'CRON'
0 3 * * 0 root certbot renew --quiet --deploy-hook "docker compose -f /opt/peru-calcula/docker-compose.prod.yml restart nginx"
CRON

# ── 7. SSH key para GitHub Actions ────────────────────────────────────────────
DEPLOY_SSH_DIR="/home/$DEPLOY_USER/.ssh"
mkdir -p "$DEPLOY_SSH_DIR"
chmod 700 "$DEPLOY_SSH_DIR"

if [ ! -f "$DEPLOY_SSH_DIR/authorized_keys" ]; then
  touch "$DEPLOY_SSH_DIR/authorized_keys"
  chmod 600 "$DEPLOY_SSH_DIR/authorized_keys"
fi
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_SSH_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Servidor listo. Próximos pasos:"
echo ""
echo "  1. Copia el contenido de docker-compose.prod.yml al servidor:"
echo "     scp docker-compose.prod.yml deploy@$DOMAIN:$APP_DIR/"
echo "     scp docker/nginx.prod.conf   deploy@$DOMAIN:$APP_DIR/docker/"
echo ""
echo "  2. Crea el archivo .env en $APP_DIR/.env con los valores reales"
echo "     (usa .env.example como plantilla)"
echo ""
echo "  3. Agrega la clave SSH pública de GitHub Actions al servidor:"
echo "     echo 'CLAVE_PUBLICA' >> /home/deploy/.ssh/authorized_keys"
echo ""
echo "  4. Configura los GitHub Secrets (ver README-deploy.md)"
echo ""
echo "  5. Primer deploy:"
echo "     cd $APP_DIR && docker compose -f docker-compose.prod.yml pull"
echo "     docker compose -f docker-compose.prod.yml up -d"
echo "═══════════════════════════════════════════════════════════════════"
