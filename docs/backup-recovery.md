# Backup & Disaster Recovery (DR)

This document describes the database backup procedures, encryption routines, storage endpoints, and restoration guides.

## Backup Policies

To prevent data loss and align with enterprise standards:

- **Daily Full Backups**: Handled by running `backup-db.sh` once every 24 hours. The script outputs symmetric GPG-encrypted SQL files.
- **Hourly Incremental backups**: Achieved in AWS using automated RDS snapshots and WAL (Write-Ahead Logging) archiving.
- **Storage Locations**:
  - In development: backups are stored inside `/tmp/jobportal_backups/`.
  - In production: backups are automatically pushed to a dedicated, encrypted S3 bucket.
- **Retention Schedule**:
  - Daily backups are retained on S3/locally for 30 days.
  - Weekly copies are retained for 3 months.
  - Monthly copies are archived for 1 year.

---

## Backup Shell Script Usage

### Running Dumps and Encryption
Execute the backup script:
```bash
./scripts/backup-db.sh
```
This script does the following:
1. Runs `pg_dump` on the database.
2. Encrypts the SQL output using symmetric GPG encryption using a passphrase (`DevBackupKey2026!`).
3. Deletes the unencrypted SQL file.
4. Uploads the encrypted GPG archive to S3.
5. Cleans up local copies older than 30 days.

---

## Database Restoration Guide

In the event of database failure or disaster recovery tests:

### 1. Download Backup
Retrieve the latest `.sql.gpg` file from S3 or local backup directories.

### 2. Run Restoration Script
Execute `restore-db.sh`, providing the path to the GPG backup file:
```bash
./scripts/restore-db.sh /tmp/jobportal_backups/db_backup_XXXXXXXX_XXXXXX.sql.gpg
```
This script does the following:
1. Prompts for or reads the GPG decryption passphrase.
2. Decrypts the GPG archive to `/tmp/restore_temp.sql`.
3. Runs the SQL script against the database engine via `psql`.
4. Deletes the decrypted SQL dump file immediately upon completion.

### 3. Verify Integrity
Run basic data checks:
```sql
SELECT count(*) FROM users;
SELECT count(*) FROM jobs;
```
Verify that the output numbers match expected values.
