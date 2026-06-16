#!/bin/bash
# Secure Job Portal DB Restore Script
# Enforce script failure on any command error
set -e

DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-"postgres"}
DB_NAME=${DB_NAME:-"jobportal"}
DB_PASSWORD=${DB_PASSWORD:-"postgres"}

BACKUP_FILE_GPG=$1
DECRYPTED_FILE="/tmp/restore_temp.sql"

# In prod: fetch keys from Vault / AWS KMS
ENCRYPTION_PASSPHRASE=${BACKUP_PASSPHRASE:-"DevBackupKey2026!"}

# Validate inputs
if [ -z "$BACKUP_FILE_GPG" ]; then
    echo "Error: Path to encrypted backup file required."
    echo "Usage: $0 /path/to/backup.sql.gpg"
    exit 1
fi

if [ ! -f "$BACKUP_FILE_GPG" ]; then
    echo "Error: GPG Backup file '${BACKUP_FILE_GPG}' not found."
    exit 1
fi

echo "=== DATABASE RESTORATION INITIATED ==="

# 1. Decrypt the database dump
echo "Decrypting file '${BACKUP_FILE_GPG}'..."
gpg --batch --yes --passphrase "$ENCRYPTION_PASSPHRASE" -d -o "$DECRYPTED_FILE" "$BACKUP_FILE_GPG"

# 2. Run psql restore
export PGPASSWORD="$DB_PASSWORD"
echo "Applying database schemas and restoring tables..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DECRYPTED_FILE"

# Clean up temporary decrypted SQL file
rm -f "$DECRYPTED_FILE"

echo "=== DATABASE RESTORATION SUCCESSFUL [$(date)] ==="
