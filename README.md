# 🚗 DriveEasy — Vehicle Rental Management System

A full-stack vehicle rental application built with **React** (frontend) + **Node.js/Express** (backend) + **Oracle Database**.

---

## 📁 Project Structure

```
vrms/
├── backend/          ← Node.js + Express REST API
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js          ← Oracle DB pool
│   │   │   ├── schema.sql     ← Database schema (run first)
│   │   │   ├── seed.sql       ← Pre-inserted data
│   │   │   └── seed.js        ← Node script to run schema + seed
│   │   ├── middleware/
│   │   │   └── auth.js        ← JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js        ← Login, Register, Upload DL
│   │   │   ├── vehicles.js    ← Fleet listing
│   │   │   └── reservations.js← Booking + insurance
│   │   ├── uploads/           ← Driving license files stored here
│   │   └── index.js           ← Express server entry point
│   ├── .env                   ← Oracle DB credentials
│   └── package.json
│
└── frontend/         ← React SPA
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.js  ← Global auth state
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js ← 3-step form with DL upload
    │   │   ├── FleetPage.js    ← Vehicle grid with filters
    │   │   ├── VehicleDetailPage.js ← Booking form
    │   │   ├── MyReservationsPage.js
    │   │   └── ProfilePage.js  ← DL upload/update
    │   ├── components/
    │   │   └── Navbar.js
    │   ├── utils/
    │   │   └── api.js          ← Axios instance with JWT
    │   ├── App.js
    │   └── index.css           ← Global dark luxury theme
    ├── .env
    └── package.json
```

---

## ⚙️ Prerequisites

- **Node.js** v18+
- **Oracle Database** (XE, 19c, or 21c)
- **Oracle Instant Client** (for oracledb npm package)

---

## 🗄️ Step 1: Oracle Database Setup

### 1a. Create the database user

Connect to Oracle as SYSDBA:

```sql
CREATE USER vrms_user IDENTIFIED BY VrmsPass123!;
GRANT CONNECT, RESOURCE, CREATE SESSION, CREATE TABLE,
      CREATE SEQUENCE, CREATE TRIGGER, UNLIMITED TABLESPACE TO vrms_user;
```

### 1b. Update .env with your Oracle credentials

Edit `backend/.env`:

```env
DB_USER=vrms_user
DB_PASSWORD=VrmsPass123!
DB_CONNECT_STRING=localhost:1521/XEPDB1
```

> Change `XEPDB1` to your service name (e.g., `ORCL`, `XE`, `FREE`)

### 1c. Run Schema + Seed via Node

```bash
cd backend
npm install
npm run seed
```

This will:
- Drop and recreate all 16 tables
- Create all sequences
- Insert pre-populated data (categories, branches, vehicles, users)

---

## 🚀 Step 2: Start the Backend

```bash
cd backend
npm run dev     # uses nodemon for hot reload
# or
npm start       # production
```

Server runs at: `http://localhost:5000`

**API Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | ❌ | Register + upload DL |
| POST | /api/auth/login | ❌ | Get JWT token |
| GET | /api/auth/me | ✅ | Current user profile |
| POST | /api/auth/upload-dl | ✅ | Update driving license |
| GET | /api/vehicles | ❌ | List available vehicles |
| GET | /api/vehicles/categories | ❌ | Vehicle categories |
| GET | /api/vehicles/:id | ❌ | Single vehicle detail |
| POST | /api/reservations | ✅ | Create reservation |
| GET | /api/reservations/my | ✅ | My reservations |
| GET | /api/reservations/:id | ✅ | Single reservation |
| GET | /api/reservations/insurance-plans/list | ❌ | Insurance plans |

---

## 🌐 Step 3: Start the Frontend

```bash
cd frontend
npm install
npm start
```

App runs at: `http://localhost:3000`

---

## 👤 Demo Credentials

| Email | Password | Notes |
|-------|----------|-------|
| john.doe@email.com | password | No DL uploaded yet |
| jane.smith@email.com | password | Has past reservations |
| mike.j@email.com | password | Has past reservations |

> All demo accounts use the password: `password` (bcrypt hashed)

---

## 🗃️ Pre-Seeded Data

| Table | Records |
|-------|---------|
| Address | 5 addresses |
| Customers | 3 demo users |
| Vehicle Categories | 5 (Economy, SUV, Luxury, Pickup, Van) |
| Branches | 3 (Toronto Downtown, Toronto West, Mississauga) |
| Vehicles | 9 vehicles across all categories |
| Employees | 3 employees |
| Vendors | 2 (Insurance + Maintenance) |
| Insurance Plans | 3 (Basic, Standard, Premium) |
| Promotions | 3 promo codes |
| Reservations | 2 completed sample reservations |
| Reviews | 2 published reviews |

---

## ✨ Features

### Authentication
- JWT-based login/register
- 3-step registration with driving license upload (JPG/PNG/PDF)
- Protected routes

### Fleet Browsing
- Filter by vehicle category
- Search by make, model, type
- Real-time availability status

### Booking Flow
1. Select vehicle → View details
2. Choose pickup & return dates (auto-calculates duration)
3. Optional: select insurance plan
4. Real-time cost summary (vehicle cost + insurance + deposit)
5. Reservation confirmed with ID

### My Profile
- View personal info
- Upload/update driving license
- View all past & active reservations

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

```env
DB_USER=vrms_user
DB_PASSWORD=your_password
DB_CONNECT_STRING=localhost:1521/XEPDB1
PORT=5000
JWT_SECRET=vrms_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./src/uploads
MAX_FILE_SIZE=5242880
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=DriveEasy
```
