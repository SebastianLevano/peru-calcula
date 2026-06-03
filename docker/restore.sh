#!/bin/sh
# Restore de un backup de PostgreSQL sobre una instancia limpia (ADR-30).
# Uso: restore.sh <archivo_backup.sql.gz> [nombre_db_destino]
#
# Ejemplo:
#   docker run --rm -v pgbackups:/backups -e PGPASSWORD=postgres \
#     postgres:17-alpine sh /restore.sh /backups/backup_20260603_030000.sql.gz peru_calcula_restored

set -e

BACKUP_FILE="${1:-}"
DB_DEST="${2:-peru_calcula_restored}"
DB_HOST="${PGHOST:-db}"
DB_PORT="${PGPORT:-5432}"
DB_USER="${PGUSER:-postgres}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "[restore] ERROR: Especifica el archivo de backup como primer argumento."
  echo "  Uso: $0 <backup_file.sql.gz> [db_destino]"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[restore] ERROR: Archivo no encontrado: ${BACKUP_FILE}"
  exit 1
fi

echo "[restore] Restaurando ${BACKUP_FILE} → ${DB_DEST} en ${DB_HOST}:${DB_PORT}"

# Crear la DB destino si no existe
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres \
  -c "SELECT 1 FROM pg_database WHERE datname='${DB_DEST}'" \
  | grep -q 1 || \
  psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres \
    -c "CREATE DATABASE ${DB_DEST};"

# Restaurar
gunzip -c "${BACKUP_FILE}" | \
  pg_restore \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_DEST}" \
    --no-password \
    --clean \
    --if-exists \
    --format=custom \
    --exit-on-error

echo "[restore] Restore completado exitosamente en ${DB_DEST}."
