# StockFlow — REST API Documentation

Base URL: `http://localhost:5000/api`

---

## Authentication & Headers

Protected routes require a JSON Web Token sent in the HTTP `Authorization` header:

```http
Authorization: Bearer <jwt_token>
```

### Standard Response Structure

#### Success Response
```json
{
  "success": true,
  "message": "Optional descriptive success message",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

---

## 1. Authentication Endpoints

### Register User
Creates a new `Admin` or `Staff` user.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No

#### Request Body
```json
{
  "name": "Alex Johnson",
  "email": "alex@company.com",
  "password": "password123",
  "role": "Staff"
}
```
*Note: `role` must be `'Admin'` or `'Staff'`. Defaults to `'Staff'` if omitted.*

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "6791...a1",
      "name": "Alex Johnson",
      "email": "alex@company.com",
      "role": "Staff"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login User
Authenticates credentials and returns a JWT token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No

#### Request Body
```json
{
  "email": "admin@inventory.com",
  "password": "password123"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "6791...f4",
      "name": "Admin Manager",
      "email": "admin@inventory.com",
      "role": "Admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User Profile
Returns the profile of the authenticated user.

- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth Required**: Yes (`Admin` or `Staff`)

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6791...f4",
      "name": "Admin Manager",
      "email": "admin@inventory.com",
      "role": "Admin",
      "createdAt": "2026-09-22T17:55:00.000Z"
    }
  }
}
```

---

## 2. Product Endpoints

### List / Search Products
Returns products with optional search and filtering.

- **URL**: `/products`
- **Method**: `GET`
- **Auth Required**: Yes (`Admin` or `Staff`)
- **Query Parameters**:
  - `search` *(string)*: Case-insensitive search on product name or SKU.
  - `category` *(string)*: Filter by category (e.g. `'Electronics'`).
  - `status` *(string)*: `'Active'` or `'Inactive'`.
  - `stockStatus` *(string)*: `'inStock'` (> 0), `'lowStock'` (< 10), or `'outOfStock'` (=== 0).
  - `sort` *(string)*: Sort field (default `'-createdAt'`).

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "6791...b2",
        "name": "Wireless Precision Mouse",
        "SKU": "MS-WLS-002",
        "category": "Electronics",
        "price": 34.5,
        "stockQuantity": 60,
        "status": "Active",
        "createdAt": "2026-09-22T18:00:00.000Z",
        "updatedAt": "2026-09-22T18:00:00.000Z"
      }
    ],
    "total": 1,
    "categories": ["Electronics", "Furniture", "Office Supplies"]
  }
}
```

---

### Get Product by ID
Retrieves details of a single product.

- **URL**: `/products/:id`
- **Method**: `GET`
- **Auth Required**: Yes (`Admin` or `Staff`)

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "_id": "6791...b2",
    "name": "Wireless Precision Mouse",
    "SKU": "MS-WLS-002",
    "category": "Electronics",
    "price": 34.5,
    "stockQuantity": 60,
    "status": "Active"
  }
}
```

---

### Create Product
Creates a new product in the catalog.

- **URL**: `/products`
- **Method**: `POST`
- **Auth Required**: Yes (**Admin only**)

#### Request Body
```json
{
  "name": "Ergonomic Standing Desk",
  "SKU": "DK-STND-008",
  "category": "Furniture",
  "price": 389.99,
  "stockQuantity": 15,
  "status": "Active"
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "6791...c3",
    "name": "Ergonomic Standing Desk",
    "SKU": "DK-STND-008",
    "category": "Furniture",
    "price": 389.99,
    "stockQuantity": 15,
    "status": "Active"
  }
}
```

---

### Update Product
Updates fields of an existing product.

- **URL**: `/products/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (**Admin only**)

#### Request Body
```json
{
  "price": 369.99,
  "stockQuantity": 20
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "6791...c3",
    "name": "Ergonomic Standing Desk",
    "SKU": "DK-STND-008",
    "price": 369.99,
    "stockQuantity": 20
  }
}
```

---

### Delete Product
Removes a product from the inventory catalog.

- **URL**: `/products/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (**Admin only**)

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "id": "6791...c3"
  }
}
```

---

## 3. Order Endpoints

### Create Order
Validates product availability, calculates totals server-side, reduces stock, and creates an order.

- **URL**: `/orders`
- **Method**: `POST`
- **Auth Required**: Yes (**Staff only**)

#### Request Body
```json
{
  "customerName": "Acme Global Industries",
  "items": [
    {
      "productId": "6791...b2",
      "quantity": 2
    }
  ]
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "6791...d4",
    "customerName": "Acme Global Industries",
    "items": [
      {
        "productId": "6791...b2",
        "name": "Wireless Precision Mouse",
        "quantity": 2,
        "price": 34.5,
        "subtotal": 69.0
      }
    ],
    "totalAmount": 69.0,
    "orderStatus": "Pending",
    "createdBy": "6791...a1",
    "createdDate": "2026-09-22T22:00:00.000Z"
  }
}
```

---

### List Orders
Returns orders accessible to the user (`Admin` sees all orders; `Staff` sees only their own).

- **URL**: `/orders`
- **Method**: `GET`
- **Auth Required**: Yes (`Admin` or `Staff`)
- **Query Parameters**:
  - `search` *(string)*: Case-insensitive search on customer name.
  - `status` *(string)*: Filter by `'Pending'`, `'Processing'`, `'Shipped'`, or `'Delivered'`.
  - `fromDate` *(ISO date string)*: Start of date range.
  - `toDate` *(ISO date string)*: End of date range.
  - `sort` *(string)*: Sort field (default `'-createdAt'`).

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "6791...d4",
        "customerName": "Acme Global Industries",
        "items": [ ... ],
        "totalAmount": 69.0,
        "orderStatus": "Pending",
        "createdDate": "2026-09-22T22:00:00.000Z",
        "createdBy": {
          "_id": "6791...a1",
          "name": "Alex Johnson",
          "email": "alex@company.com"
        }
      }
    ],
    "total": 1
  }
}
```

---

### Get Order by ID
Retrieves details and items of a specific order.

- **URL**: `/orders/:id`
- **Method**: `GET`
- **Auth Required**: Yes (`Admin` or owner `Staff`)

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "_id": "6791...d4",
    "customerName": "Acme Global Industries",
    "items": [ ... ],
    "totalAmount": 69.0,
    "orderStatus": "Pending",
    "createdDate": "2026-09-22T22:00:00.000Z",
    "createdBy": {
      "_id": "6791...a1",
      "name": "Alex Johnson",
      "email": "alex@company.com"
    }
  }
}
```

---

### Update Order Status
Updates fulfillment status of an order.

- **URL**: `/orders/:id/status`
- **Method**: `PATCH`
- **Auth Required**: Yes (**Admin only**)

#### Request Body
```json
{
  "status": "Shipped"
}
```
*Valid values: `'Pending'`, `'Processing'`, `'Shipped'`, `'Delivered'`*

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Order status updated to 'Shipped'",
  "data": {
    "_id": "6791...d4",
    "orderStatus": "Shipped"
  }
}
```

---

## 4. Dashboard Endpoints

### Get Dashboard Statistics
Returns aggregated counts for the 4 dashboard metric cards and lists of low-stock and recent items.

- **URL**: `/dashboard/stats`
- **Method**: `GET`
- **Auth Required**: Yes (**Admin only**)

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "totalProducts": 10,
    "lowStockProducts": 3,
    "totalOrders": 14,
    "pendingOrders": 4,
    "lowStockThreshold": 10,
    "lowStockItems": [ ... ],
    "recentOrders": [ ... ]
  }
}
```
