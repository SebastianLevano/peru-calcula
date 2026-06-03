#!/bin/sh
# Backup diario de PostgreSQL con retención configurable (ADR-30).
# Ejecutado por el servicio `backup` en docker-compose.yml a las 03:00 UTC.

set -e

DB_HOST="${PGHOST:-db}"
DB_PORT="${PGPORT:-5432}"
DB_NAME="${POSTGRES_DB:-peru_calcula_dev}"
DB_USER="${PGUSER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"

echo "[backup] Iniciando backup de ${DB_NAME} → ${BACKUP_FILE}"

# pg_dump comprimido
pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-password \
  --format=custom \
  --compress=6 \
  | gzip > "${BACKUP_FILE}"

echo "[backup] Backup completado: $(du -sh ${BACKUP_FILE} | cut -f1)"

# Limpiar backups antiguos
find "${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "[backup] Limpieza: backups de más de ${RETENTION_DAYS} días eliminados."

# Registro en log
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") OK ${BACKUP_FILE}" >> "${BACKUP_DIR}/backup.log"
