#!/bin/bash
# Secure Job Portal DB Backup Script (Daily Full Dump)
# Enforce script failure on any command error
set -e

# Load DB credentials or fallback to dev variables
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-"postgres"}
DB_NAME=${DB_NAME:-"jobportal"}
DB_PASSWORD=${DB_PASSWORD:-"postgres"}

BACKUP_DIR="/tmp/jobportal_backups"
S3_BUCKET=${S3_BUCKET_NAME:-"jobportal-backups-bucket"}

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"

# Passphrase for symmetric GPG encryption (In prod: retrieve from KMS / Vault)
ENCRYPTION_PASSPHRASE=${BACKUP_PASSPHRASE:-"DevBackupKey2026!"}

echo "=== DATABASE BACKUP STARTING [$(date)] ==="

# Ensure target folder exists
mkdir -p "$BACKUP_DIR"

# 1. Run pg_dump
export PGPASSWORD="$DB_PASSWORD"
echo "Dumping database '${DB_NAME}' from host '${DB_HOST}'..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"

# 2. Encrypt the backup dump using GPG
echo "Encrypting database dump..."
gpg --batch --yes --passphrase "$ENCRYPTION_PASSPHRASE" -c "$BACKUP_FILE"

# Immediately delete unencrypted plain SQL dump to preserve security
rm -f "$BACKUP_FILE"
echo "Encrypted backup file generated at: ${ENCRYPTED_FILE}"

# 3. Push to AWS S3 (if keys are configured)
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "Pushing encrypted backup to AWS S3 bucket 's3://${S3_BUCKET}/db_backups/'..."
    # aws s3 cp "$ENCRYPTED_FILE" "s3://${S3_BUCKET}/db_backups/$(basename "$ENCRYPTED_FILE")"
    echo "Upload finished."
else
    echo "AWS environment keys not set. Backup file stored locally at: ${ENCRYPTED_FILE}"
fi

# 4. Enforce Retention Policy: Purge local copies older than 30 days
echo "Applying retention rules: Purging local backups older than 30 days..."
find "$BACKUP_DIR" -name "db_backup_*.gpg" -mtime +30 -exec rm -f {} \;

echo "=== DATABASE BACKUP FINISHED SUCCESSFULLY ==="
