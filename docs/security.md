# Security Hardening & Threat Model

This document outlines the security architecture, threat mitigations, and best practices implemented within the Secure Job Portal Platform.

## OWASP Top 10 Mitigations

| Threat Vector | Platform Defense Strategy |
| :--- | :--- |
| **A01:2021-Broken Access Control** | Enforced by JWT role-based checks (`Candidate`, `Recruiter`, `Admin`). Access boundaries are validated on every endpoint on the server. |
| **A03:2021-Injection** | Defended by parameterized SQL queries across all PostgreSQL transactions. No dynamic SQL assembly is used. |
| **A05:2021-Security Misconfiguration** | Helmet.js secures headers on the backend. Default passwords and credentials are replaced by dynamic env variables. |
| **A07:2021-Identification & Authentication Failures** | Hashed passwords using bcrypt (10 rounds). Automatically locks down accounts for 15 minutes after 5 consecutive failures. |
| **A08:2021-Software and Data Integrity Failures** | Scans file content headers (magic bytes) to prevent executable renaming and traversal scripts. |

---

## Implemented Protections

### 1. Database-Level Lockouts & Cryptography
- **Password Hashing**: User credentials are encrypted using bcrypt (cost factor: 10) on registration. The database only stores hashes, not raw secrets.
- **Account Lockouts**: Every user entry contains a `failed_login_attempts` counter.
  - If a user inputs wrong credentials 5 times in a row, the account sets `account_locked_until` to `now() + 15 minutes`.
  - Subsequent login requests during this window are rejected before comparing passwords, mitigating timing attacks.

### 2. Secure File Upload Rules
- **Size Restrictions**: File sizes are capped at 5MB within Multer filters.
- **Double Extension Checks**: Uploads are restricted to `.pdf` and `.docx` extensions.
- **Magic Bytes Inspection**: To prevent malware uploads disguised as PDF documents, the system reads the first 4 bytes of uploaded files:
  - PDF headers must match `%PDF` (`25504446`).
  - DOCX headers must match standard PK ZIP archives (`504B0304`).
  - Mismatches immediately delete the file and trigger a security log.
- **Directory Traversal Defense**: The system ignores the user-supplied filename and renames files to a random UUID, preventing malicious path execution.

### 3. Network & Infrastructure Boundaries
- **Isolated Subnets**: The PostgreSQL database runs in private subnets, rejecting direct internet traffic.
- **Least Privilege Groups**: Security groups only permit ingress traffic from the ALB to the app server, and from the app server to the RDS instance.
- **HSTS & Secure Headers**: Helmet applies HSTS (Strict-Transport-Security), X-Content-Type-Options, and frames blocking (Clickjacking mitigation).
