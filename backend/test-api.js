const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

let server;
let baseUrl;

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
};

const runTests = async () => {
  try {
    console.log('\n--- Starting Backend API Test Suite ---\n');
    await connectDB();

    // Clean DB
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // Start ephemeral server
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`Test server running at ${baseUrl}`);
        resolve();
      });
    });

    console.log('\n1. Test Authentication & Validation:');
    // Register Admin
    const regAdminRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Admin Test',
        email: 'admintest@test.com',
        password: 'password123',
        role: 'Admin'
      }
    });
    assert(regAdminRes.status === 201, 'Admin registered with status 201');
    assert(regAdminRes.data.data.token, 'Admin received JWT token');
    const adminToken = regAdminRes.data.data.token;

    // Register Staff
    const regStaffRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Staff Test',
        email: 'stafftest@test.com',
        password: 'password123',
        role: 'Staff'
      }
    });
    assert(regStaffRes.status === 201, 'Staff registered with status 201');
    const staffToken = regStaffRes.data.data.token;

    // Duplicate email registration should fail with 409
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Duplicate User',
        email: 'admintest@test.com',
        password: 'password123',
        role: 'Staff'
      }
    });
    assert(dupRes.status === 409, 'Duplicate email registration rejected with 409 Conflict');

    // Login with invalid credentials should fail with 401
    const invalidLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admintest@test.com',
        password: 'wrongpassword'
      }
    });
    assert(invalidLogin.status === 401, 'Invalid login credentials rejected with 401 Unauthorized');

    // Valid login
    const validLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admintest@test.com',
        password: 'password123'
      }
    });
    assert(validLogin.status === 200, 'Valid login succeeds with 200 OK');

    console.log('\n2. Test Product Authorization & Management:');
    // Staff trying to create a product should receive 403 Forbidden
    const staffCreateProd = await request('/api/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        name: 'Unauthorized Item',
        SKU: 'UNAUTH-001',
        category: 'Test',
        price: 50,
        stockQuantity: 10
      }
    });
    assert(staffCreateProd.status === 403, 'Staff is blocked from creating product with 403 Forbidden');

    // Admin creates product
    const adminCreateProd1 = await request('/api/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Wireless Keyboard',
        SKU: 'KB-001',
        category: 'Electronics',
        price: 49.99,
        stockQuantity: 20,
        status: 'Active'
      }
    });
    assert(adminCreateProd1.status === 201, 'Admin creates product with 201 Created');
    const product1 = adminCreateProd1.data.data;

    // Admin creates product 2 with low stock (< 10)
    const adminCreateProd2 = await request('/api/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Office Mouse Pad',
        SKU: 'MP-002',
        category: 'Accessories',
        price: 15.0,
        stockQuantity: 5,
        status: 'Active'
      }
    });
    assert(adminCreateProd2.status === 201, 'Admin creates second product (low stock)');
    const product2 = adminCreateProd2.data.data;

    // Admin creates inactive product
    const adminCreateProd3 = await request('/api/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Discontinued Item',
        SKU: 'DISC-003',
        category: 'Accessories',
        price: 10.0,
        stockQuantity: 50,
        status: 'Inactive'
      }
    });
    assert(adminCreateProd3.status === 201, 'Admin creates inactive product');
    const product3 = adminCreateProd3.data.data;

    // Duplicate SKU should fail with 409
    const dupSkuRes = await request('/api/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Another Keyboard',
        SKU: 'KB-001',
        category: 'Electronics',
        price: 59.99,
        stockQuantity: 5
      }
    });
    assert(dupSkuRes.status === 409, 'Duplicate SKU rejected with 409 Conflict');

    // Update product
    const updateRes = await request(`/api/products/${product1._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        price: 45.0
      }
    });
    assert(updateRes.status === 200, 'Admin can update product details');
    assert(updateRes.data.data.price === 45.0, 'Price updated to 45.0');

    // Both Admin and Staff can list products
    const staffListProd = await request('/api/products', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffListProd.status === 200, 'Staff can view products');
    assert(staffListProd.data.data.products.length === 3, 'Found 3 products in inventory');

    console.log('\n3. Test Order Creation, Calculation & Stock Validation:');
    // Staff attempts to order more than available stock (Requested 25, Available 20)
    const overstockOrder = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        customerName: 'Too Big Buyer',
        items: [{ productId: product1._id, quantity: 25 }]
      }
    });
    assert(overstockOrder.status === 400, 'Order exceeding stock is rejected with 400 Bad Request');

    // Staff attempts to order inactive product
    const inactiveOrder = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        customerName: 'Inactive Buyer',
        items: [{ productId: product3._id, quantity: 2 }]
      }
    });
    assert(inactiveOrder.status === 400, 'Order with inactive product is rejected with 400 Bad Request');

    // Staff creates valid order (Qty 4 of product 1 @ $45.00 = $180.00)
    // Note: client passes NO totalAmount, backend computes it!
    const validOrder = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        customerName: 'Global Corp',
        items: [{ productId: product1._id, quantity: 4 }],
        totalAmount: 1.0 // Malicious client-provided amount to test backend ignores client total
      }
    });
    assert(validOrder.status === 201, 'Order created successfully with 201 Created');
    assert(validOrder.data.data.totalAmount === 180.0, 'Order total calculated server-side ($180.00)');
    assert(validOrder.data.data.orderStatus === 'Pending', 'Initial order status is Pending');
    const orderId = validOrder.data.data._id;

    // Verify stock was reduced on product 1 (20 - 4 = 16)
    const checkProduct1 = await request(`/api/products/${product1._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(checkProduct1.data.data.stockQuantity === 16, 'Product stock correctly reduced from 20 to 16');

    console.log('\n4. Test Order Access & Status Updates:');
    // Staff can view their own orders
    const staffOrders = await request('/api/orders', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffOrders.status === 200, 'Staff can view their orders');
    assert(staffOrders.data.data.orders.length === 1, 'Staff sees exactly 1 order they created');

    // Admin updates order status to 'Processing'
    const updateStatusRes = await request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Processing' }
    });
    assert(updateStatusRes.status === 200, 'Admin can update order status');
    assert(updateStatusRes.data.data.orderStatus === 'Processing', 'Order status updated to Processing');

    // Staff cannot update order status
    const staffUpdateStatus = await request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: { status: 'Shipped' }
    });
    assert(staffUpdateStatus.status === 403, 'Staff cannot update order status (403 Forbidden)');

    console.log('\n5. Test Dashboard Metrics:');
    // Staff cannot view dashboard stats
    const staffDash = await request('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffDash.status === 403, 'Staff blocked from dashboard stats (403 Forbidden)');

    // Admin can view dashboard stats
    const adminDash = await request('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminDash.status === 200, 'Admin can access dashboard stats');
    assert(adminDash.data.data.totalProducts === 3, 'Dashboard reports 3 total products');
    assert(adminDash.data.data.lowStockProducts === 1, 'Dashboard reports 1 low-stock product (< 10)');
    assert(adminDash.data.data.totalOrders === 1, 'Dashboard reports 1 total order');
    assert(adminDash.data.data.pendingOrders === 0, 'Dashboard reports 0 pending orders (order was moved to Processing)');

    console.log('\n======================================================');
    console.log('✓ ALL BACKEND AUTOMATED TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await disconnectDB();
    process.exit(process.exitCode || 0);
  }
};

runTests();
