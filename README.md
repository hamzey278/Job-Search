# Secure Job Portal Platform

An enterprise-grade, full-stack Job Portal application featuring robust user authentication, role-based access control (RBAC), multi-layer security hardening, automated backups, and advanced system telemetries.

---

## Technical Stack

- **Frontend**: React.js (Vite), React Router v6, Axios, Lucide Icons, Vanilla CSS OKLCH styling.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL.
- **Containerization**: Docker, Docker Compose.
- **Observability**: Prometheus, Grafana, Node Exporter.
- **Security**: Winston logging, Helmet.js, CORS controls, express-rate-limit, GPG encryption.
- **Infrastructure & CI/CD**: Terraform (AWS VPC/RDS/S3/ALB), GitHub Actions workflows.

---

## Project Structure

```
├── backend/                # Express API server (Helmet, Rate Limiter, Winston, JWT)
├── frontend/               # React client application (Vite, Axios, Router)
├── infrastructure/         # AWS infrastructure as Code (Terraform)
├── monitoring/             # Telemetry configurations (Prometheus YAML, Grafana Provisioning)
├── scripts/                # Database Backup & Restoration shell scripts
├── docs/                   # Full-scope architecture and security documentation
├── init-db.sql             # SQL Database schema setup
└── docker-compose.yml      # Local development multi-container orchestration
```

---

## Environment Configuration

Create a `.env` file inside the `backend/` directory based on the `backend/.env.example` template:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=jobportal

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1h

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5

ALLOWED_ORIGIN=http://localhost:5173
```

---

## Getting Started

### Method 1: Local Execution (Node.js & Native Postgres)

#### Prerequisites
- Node.js (v18+)
- PostgreSQL running locally

#### 1. Setup Database
Create a database named `jobportal` and run the queries defined in [init-db.sql](file:///Users/hamza/Desktop/WORK/UNV%20&%20UN/DevOps/init-db.sql) to set up tables and default profiles.

#### 2. Start Backend API
```bash
cd backend
npm install
npm run dev
```

#### 3. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

### Method 2: Docker Compose (Fully Orchestrated)

#### Prerequisites
- Docker and Docker Compose installed.

#### Steps
Run the entire stack (Database, API, Client, Prometheus, Node Exporter, Grafana) in detached mode:
```bash
docker-compose up --build -d
```

#### Available Services:
- **Web App**: [http://localhost](http://localhost)
- **Backend API**: [http://localhost:5000/health](http://localhost:5000/health)
- **Prometheus Scraper**: [http://localhost:9090](http://localhost:9090)
- **Grafana Dashboard**: [http://localhost:3000](http://localhost:3000) (Default user: Anonymous Admin)

To stop and remove all services:
```bash
docker-compose down -v
```

---

## Security Hardening Details

1. **SQL Injection**: Parameterized SQL queries defend all DB records.
2. **Account Lockout**: 5 failed login entries within 15 minutes trigger temporary lockout blocks.
3. **Magic Byte Check**: The uploads system reads file headers (`%PDF` / `PK`) to verify file formats.
4. **IP Rate Limiter**: express-rate-limit restricts brute-force entries on authentication routes.
5. **Least Privilege Accounts**: Non-root `node` users run all Docker services.
6. **Encrypted Backups**: GPG symmetric decryption guards daily DB dumps.

---

## Seed Accounts (For Testing)

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@jobportal.com` | `AdminPassword123!` |
| **Recruiter** | `recruiter@jobportal.com` | `RecruiterPassword123!` |
| **Candidate** | `candidate@jobportal.com` | `CandidatePassword123!` |
