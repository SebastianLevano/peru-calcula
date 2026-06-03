#!/bin/sh
# Prueba de restore mínima — ADR-30.
# Toma el backup más reciente, lo restaura en una DB temporal
# y verifica integridad de parámetros normativos.
#
# Usado en CI para garantizar que los backups son restaurables.
# Requiere: Docker con postgres:17-alpine, PGPASSWORD en entorno.

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_HOST="${PGHOST:-db}"
DB_PORT="${PGPORT:-5432}"
DB_USER="${PGUSER:-postgres}"
VERIFY_DB="peru_calcula_verify_$(date +%s)"

# Encontrar el backup más reciente
LATEST=$(ls -t "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "${LATEST}" ]; then
  echo "[verify] ERROR: No se encontraron backups en ${BACKUP_DIR}"
  exit 1
fi

echo "[verify] Usando backup: ${LATEST}"

# Restore en DB temporal
sh "$(dirname "$0")/restore.sh" "${LATEST}" "${VERIFY_DB}"

# Verificar integridad: la tabla parametros debe tener registros
PARAM_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${VERIFY_DB}" \
  -tAc "SELECT COUNT(*) FROM parametros WHERE clave IS NOT NULL;")

echo "[verify] Registros en parametros: ${PARAM_COUNT}"

if [ "${PARAM_COUNT}" -lt 1 ]; then
  echo "[verify] ERROR: La tabla parametros está vacía — backup inválido o migración fallida."
  # Limpiar antes de fallar
  psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres \
    -c "DROP DATABASE IF EXISTS ${VERIFY_DB};" || true
  exit 1
fi

# Verificar UIT presente
UIT_OK=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${VERIFY_DB}" \
  -tAc "SELECT COUNT(*) FROM parametros WHERE clave='UIT' AND valor IS NOT NULL;")

if [ "${UIT_OK}" -lt 1 ]; then
  echo "[verify] ERROR: Parámetro UIT no encontrado — backup inconsistente."
  psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres \
    -c "DROP DATABASE IF EXISTS ${VERIFY_DB};" || true
  exit 1
fi

echo "[verify] OK — Backup válido. UIT presente, ${PARAM_COUNT} parámetros restaurados."

# Limpiar DB temporal
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres \
  -c "DROP DATABASE IF EXISTS ${VERIFY_DB};"

echo "[verify] DB temporal ${VERIFY_DB} eliminada."
