# Inventory & Stock Management System

Full-stack inventory project built from scratch with React + Vite, Bootstrap, Node.js, Express, MySQL (`mysql2`), JWT and bcrypt. Database is managed through MySQL Server / MySQL Workbench; MongoDB is not used.

## Features
- JWT login and role-aware user accounts (admin, manager, staff)
- Dashboard with inventory totals, low-stock count, stock value and recent stock movements
- Product, category and supplier CRUD
- Stock-in / stock-out movements with validation and audit history
- Search and filtering for products
- Low-stock indicators
- Responsive Bootstrap UI

## Requirements
Node.js 20+; MySQL 8+; MySQL Workbench optional for running the SQL script.

## 1. Create database
Open `database/schema.sql` in MySQL Workbench and execute it. It creates `inventory_management` and its tables.

## 2. Backend setup
```bash
cd backend
copy .env.example .env
npm install
npm run dev
```
Edit `.env` with your MySQL credentials and a long random `JWT_SECRET`. API runs at `http://localhost:5000`.

## 3. Frontend setup
Open a second terminal:
```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```
Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

## First admin user
Use the Register screen to create an account. For a real deployment, disable public registration and create the first admin securely. The API currently accepts `role` only as `staff` during public registration; update the user's role in MySQL Workbench when creating the initial admin:
```sql
UPDATE users SET role='admin' WHERE email='your-email@example.com';
```
Then sign out and sign back in.

## API overview
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/products`
- `GET/POST/PUT/DELETE /api/categories`
- `GET/POST/PUT/DELETE /api/suppliers`
- `POST /api/stock/in`, `POST /api/stock/out`, `GET /api/stock/movements`
- `GET /api/dashboard/summary`
- `GET /api/health`

## Notes
This is a practical educational starter, not a security-audited production system. Add HTTPS, rate limiting, backups, stricter role permissions and deployment secrets before production use.
