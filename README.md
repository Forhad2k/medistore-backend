# 💊 MediStore Backend API

> Full-stack REST API for MediStore – an OTC online medicine shop.  
> Built with **Express.js · TypeScript · PostgreSQL · Prisma · JWT**

---

## Tech Stack

| Layer          | Technology                       |
|----------------|----------------------------------|
| Runtime        | Node.js                          |
| Language       | TypeScript (strict mode)         |
| Framework      | Express.js                       |
| Database       | PostgreSQL                       |
| ORM            | Prisma                           |
| Auth           | JWT (jsonwebtoken + bcryptjs)    |
| Validation     | express-validator                |
| Architecture   | Modular MVC                      |

---

## Project Structure

```
src/
├── config/
│   ├── db.ts              # Prisma singleton
│   └── jwt.ts             # JWT config constants
├── controllers/
│   ├── auth.controller.ts
│   ├── medicine.controller.ts
│   ├── order.controller.ts
│   ├── review.controller.ts
│   ├── category.controller.ts
│   └── admin.controller.ts
├── middlewares/
│   ├── authenticate.ts    # JWT verification → req.user
│   ├── authorize.ts       # RBAC role guard
│   ├── validate.ts        # express-validator error handler
│   └── errorHandler.ts    # Global error handler
├── routes/
│   ├── auth.routes.ts
│   ├── medicine.routes.ts
│   ├── order.routes.ts
│   ├── seller.routes.ts
│   ├── admin.routes.ts
│   ├── category.routes.ts
│   └── review.routes.ts
├── types/
│   └── index.ts           # Shared interfaces & types
├── utils/
│   ├── ApiError.ts        # Custom error class
│   ├── ApiResponse.ts     # Standard response helper
│   ├── asyncHandler.ts    # Async route wrapper
│   ├── tokenUtils.ts      # JWT sign/verify
│   └── paginate.ts        # Pagination helper
├── validators/
│   ├── auth.validator.ts
│   ├── medicine.validator.ts
│   ├── order.validator.ts
│   ├── review.validator.ts
│   └── category.validator.ts
├── app.ts                 # Express app setup
└── server.ts              # Entry point + graceful shutdown
prisma/
├── schema.prisma          # DB schema
└── seed.ts                # Seed admin, seller, customer & categories
```

---

## Quick Start

### 1. Clone & Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET
```

### 3. Database Setup
```bash
npx prisma migrate dev --name init   # Run migrations
npx prisma generate                  # Generate client
npm run db:seed                      # Seed demo data
```

### 4. Run
```bash
npm run dev    # Development (ts-node-dev)
npm run build  # Compile TypeScript
npm start      # Production
```

---

## API Reference

### Authentication
| Method | Endpoint                    | Auth | Description         |
|--------|-----------------------------|------|---------------------|
| POST   | `/api/auth/register`        | ❌   | Register user       |
| POST   | `/api/auth/login`           | ❌   | Login               |
| GET    | `/api/auth/me`              | ✅   | Get current user    |
| PATCH  | `/api/auth/profile`         | ✅   | Update profile      |
| PATCH  | `/api/auth/change-password` | ✅   | Change password     |

### Medicines (Public)
| Method | Endpoint                       | Auth | Description             |
|--------|--------------------------------|------|-------------------------|
| GET    | `/api/medicines`               | ❌   | Browse + filter + search|
| GET    | `/api/medicines/:id`           | ❌   | Medicine details        |
| GET    | `/api/medicines/:id/reviews`   | ❌   | Medicine reviews        |
| POST   | `/api/medicines/:id/reviews`   | CUSTOMER | Leave a review   |

### Categories (Public)
| Method | Endpoint               | Auth  | Description      |
|--------|------------------------|-------|------------------|
| GET    | `/api/categories`      | ❌    | All categories   |
| GET    | `/api/categories/:id`  | ❌    | Single category  |

### Orders (Customer)
| Method | Endpoint                  | Auth     | Description     |
|--------|---------------------------|----------|-----------------|
| POST   | `/api/orders`             | CUSTOMER | Place order     |
| GET    | `/api/orders`             | CUSTOMER | My orders       |
| GET    | `/api/orders/:id`         | ✅       | Order details   |
| PATCH  | `/api/orders/:id/cancel`  | CUSTOMER | Cancel order    |

### Seller
| Method | Endpoint                      | Auth   | Description          |
|--------|-------------------------------|--------|----------------------|
| GET    | `/api/seller/medicines`       | SELLER | My inventory         |
| POST   | `/api/seller/medicines`       | SELLER | Add medicine         |
| PUT    | `/api/seller/medicines/:id`   | SELLER | Update medicine      |
| DELETE | `/api/seller/medicines/:id`   | SELLER | Delete medicine      |
| GET    | `/api/seller/orders`          | SELLER | Incoming orders      |
| PATCH  | `/api/seller/orders/:id`      | SELLER | Update order status  |

### Admin
| Method | Endpoint                      | Auth  | Description          |
|--------|-------------------------------|-------|----------------------|
| GET    | `/api/admin/stats`            | ADMIN | Dashboard stats      |
| GET    | `/api/admin/users`            | ADMIN | All users            |
| GET    | `/api/admin/users/:id`        | ADMIN | User detail          |
| PATCH  | `/api/admin/users/:id`        | ADMIN | Ban / unban user     |
| GET    | `/api/admin/orders`           | ADMIN | All orders           |
| POST   | `/api/admin/categories`       | ADMIN | Create category      |
| PUT    | `/api/admin/categories/:id`   | ADMIN | Update category      |
| DELETE | `/api/admin/categories/:id`   | ADMIN | Delete category      |

---

## Auth Flow

```
Client                        Server
  │                              │
  │  POST /api/auth/login        │
  │  { email, password }  ──────►│
  │                              │  1. Find user by email
  │                              │  2. bcrypt.compare(password, hash)
  │                              │  3. Check isBanned
  │                              │  4. jwt.sign({ id, role })
  │  { user, token }       ◄─────│
  │                              │
  │  GET /api/orders             │
  │  Authorization: Bearer <token>──►│
  │                              │  authenticate middleware:
  │                              │  1. Extract token from header
  │                              │  2. jwt.verify(token)
  │                              │  3. Fetch user from DB
  │                              │  4. Check isBanned
  │                              │  5. req.user = user
  │                              │
  │                              │  authorize("CUSTOMER"):
  │                              │  Check req.user.role
  │  { orders }            ◄─────│
```

---

## Demo Credentials (after seed)

| Role     | Email                       | Password    |
|----------|-----------------------------|-------------|
| Admin    | admin@medistore.com         | admin123    |
| Seller   | seller@medistore.com        | seller123   |
| Customer | customer@medistore.com      | customer123 |
