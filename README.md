# StockFlow — Inventory & Order Management System

A production-ready full-stack SaaS application for small business inventory control and customer order processing.

---

## Documentation Index

- 📋 **Setup & Quick Start**: [Setup Steps](#quick-start)
- ⚙️ **Environment Variables Template**: [.env.example](.env.example)
- 🗄️ **Database Model Documentation**: [docs/DATABASE_MODELS.md](docs/DATABASE_MODELS.md)
- 📡 **REST API Reference**: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- 🧪 **Postman / Thunder Client Collection**: [postman_collection.json](postman_collection.json)

---

## Architecture Overview

```
StockFlow
├── frontend/               # Next.js 14 App Router + Tailwind CSS + Lucide Icons (.jsx)
│   ├── app/
│   │   ├── (auth)/         # Login & Register with plain React useState
│   │   └── (dashboard)/    # Authenticated Layout, Dashboard, Products, Orders
│   ├── components/         # Button, Input, Modal, Select, Toast, Skeletons, Badges
│   ├── context/            # React AuthContext (JWT + User Profile state)
│   ├── services/           # Axios API clients for Auth, Products, Orders, Dashboard
│   └── utils/              # Token storage, currency/date formatters, validators
│
├── backend/                # Node.js + Express.js REST API + MongoDB Mongoose
│   ├── config/             # DB connection (MongoDB Atlas) & Env
│   ├── controllers/        # Express controllers (Auth, Products, Orders, Dashboard)
│   ├── middleware/         # JWT Auth, Role Authorization guard, Global Error Handler
│   ├── models/             # Mongoose schemas (User, Product, Order with items)
│   ├── routes/             # REST endpoints (/api/auth, /api/products, /api/orders, /api/dashboard)
│   ├── services/           # Business logic, atomic stock decrements, total calculations
│   └── validators/         # Express-validator schemas
│
└── docs/                   # Full Architecture, Model, & API Reference Guides
    ├── DATABASE_MODELS.md  # Entity schemas, ER diagram, indexes, business rules
    └── API_DOCUMENTATION.md# Full REST API reference with payload schemas & examples
```

---

## User Roles & Permissions

| Feature | Admin | Staff |
|---|---|---|
| View Dashboard Metrics (KPIs, Low-stock alerts, Recent orders) | ✅ | ❌ |
| Create / Edit / Delete Products | ✅ | ❌ |
| View Product Catalog | ✅ | ✅ |
| Search & Filter Products | ✅ | ✅ |
| Create Customer Orders | ❌ | ✅ |
| View Orders | ✅ (All orders across business) | ✅ (Only own placed orders) |
| Search Orders (By Customer Name) | ✅ | ✅ |
| Update Order Status (`Pending` → `Processing` → `Shipped` → `Delivered`) | ✅ | ❌ |

---

## Quick Start & Setup Steps

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas cluster or local MongoDB instance

### 2. Clone and Install Dependencies

Install root, backend, and frontend dependencies:

```bash
# Install root orchestration dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Environment Configuration

Copy the example environment file or configure `.env` in both packages:

Refer to [.env.example](.env.example) for the complete list of options.

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
DB_USERNAME=admin
DB_PASSWORD=your_mongodb_password
JWT_SECRET=super_secret_jwt_key_inventory_2026_dev_mode
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
LOW_STOCK_THRESHOLD=10
```
*(The backend connects directly to your MongoDB Atlas cluster using `DB_USERNAME` and `DB_PASSWORD` or an optional `MONGO_URI`.)*

#### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Seed Demo Data

Pre-populate the database with test accounts, 10 inventory products across diverse categories, and initial customer orders:

```bash
npm run seed
```

#### Default Seed Credentials:
- **Admin**: `admin@inventory.com` | `password123`
- **Staff**: `staff@inventory.com` | `password123`

*(Note: On the web login screen, you can also click the 1-click **"Fill Admin"** or **"Fill Staff"** demo buttons!)*

### 5. Start Development Servers

Run both servers concurrently or in separate terminal tabs:

**Option A — Run Both Concurrently (Recommended):**
```bash
npm run dev
```

**Option B — Run Separately:**
```bash
# Terminal 1: Backend API (Port 5000)
npm run dev:backend

# Terminal 2: Next.js Frontend (Port 3000)
npm run dev:frontend
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the web application.

---

## Automated Backend Test Suite

Run the end-to-end automated test suite:

```bash
npm run test:backend
```

The test runner executes 15 integration test suites verifying:
1. User registration & duplicate email rejection (409)
2. Authentication & JWT token verification
3. Role authorization guards (Staff blocked from product modification & dashboard stats)
4. Admin product CRUD & duplicate SKU rejection (409)
5. Staff order creation with real-time stock validation
6. Rejection of orders exceeding stock or for inactive items
7. Server-side order total calculation (ignores malicious client prices)
8. Atomic stock decrements
9. Order access isolation (Staff only accesses their orders; Admin accesses all)
10. Admin order status workflow updates
11. Dashboard metric counts & low-stock alerts

---

## Database Models Explanation

Full details, indexes, and Mermaid ER diagrams are available in [docs/DATABASE_MODELS.md](docs/DATABASE_MODELS.md).

### 1. `User` Schema (`backend/models/User.js`)
- **Fields**: `name`, `email` (unique, lowercase), `password` (bcrypt hashed with 12 salt rounds), `role` (`'Admin'` | `'Staff'`).
- **Security**: Passwords are automatically stripped in `toJSON` serialization. Provides `comparePassword` instance method.

### 2. `Product` Schema (`backend/models/Product.js`)
- **Fields**: `name`, `SKU` (unique, uppercase, indexed), `category` (indexed), `price` (min: 0), `stockQuantity` (min: 0, indexed), `status` (`'Active'` | `'Inactive'`).
- **Indexes**: Compound text index on `name` and `SKU` for rapid keyword searching; indices on `category`, `status`, and `stockQuantity` for real-time dashboard aggregation.
- **Integrity**: Deletion is protected against products attached to active (`Pending`/`Processing`) orders.

### 3. `Order` Schema (`backend/models/Order.js`)
- **Fields**: `customerName` (indexed), `items` (subdocuments), `totalAmount` (calculated server-side), `orderStatus` (`'Pending'` | `'Processing'` | `'Shipped'` | `'Delivered'`), `createdDate` (indexed), `createdBy` (ref: `User`).
- **OrderItem Subdocument**: `productId` (ref: `Product`), snapshot `name`, `quantity` (min: 1), snapshot unit `price`, `subtotal`.
- **Atomic Concurrency**: Uses MongoDB `$inc: { stockQuantity: -qty }` to prevent race conditions during simultaneous checkouts.
- **Data Isolation**: Staff queries automatically filter by `createdBy: req.user._id`; Admins query globally.

---

## API Collection & Endpoint Documentation

Complete request/response specifications and curl examples are documented in [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

### Postman Collection
An importable Postman collection is included in the project root:
- **File**: [`postman_collection.json`](postman_collection.json)
- **Features**: Pre-configured collection variables (`{{baseUrl}}`, `{{token}}`), automatic JWT token extraction script upon login, and all 10 endpoints organized into folders:
  - `Auth` (Login Admin, Login Staff, Register, Current User Profile)
  - `Products` (List Products, Create Product, Get Product, Update Product, Delete Product)
  - `Orders` (Create Order, List Orders, Get Order Details, Update Order Status)
  - `Dashboard` (Get Admin Metrics)

### Endpoint Summary

| Module | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Public | Register new user account |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate and obtain JWT |
| **Auth** | `GET` | `/api/auth/me` | Authenticated | Get current user profile |
| **Products** | `GET` | `/api/products` | Authenticated | List/search/filter products |
| **Products** | `GET` | `/api/products/:id` | Authenticated | Get product by ID |
| **Products** | `POST` | `/api/products` | Admin Only | Create new product |
| **Products** | `PUT` | `/api/products/:id` | Admin Only | Update product details / stock |
| **Products** | `DELETE` | `/api/products/:id` | Admin Only | Delete product |
| **Orders** | `POST` | `/api/orders` | Staff Only | Create order & atomically decrement stock |
| **Orders** | `GET` | `/api/orders` | Authenticated | List orders (role-scoped, search by customer) |
| **Orders** | `GET` | `/api/orders/:id` | Authenticated | Get order details |
| **Orders** | `PATCH` | `/api/orders/:id/status` | Admin Only | Update fulfillment status |
| **Dashboard** | `GET` | `/api/dashboard/stats` | Admin Only | 4 core KPIs, low-stock list, recent orders |
