const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();

    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    console.log('Seeding users...');
    const adminUser = await User.create({
      name: 'Admin Manager',
      email: 'admin@inventory.com',
      password: 'password123',
      role: 'Admin'
    });

    const staffUser = await User.create({
      name: 'Staff Operator',
      email: 'staff@inventory.com',
      password: 'password123',
      role: 'Staff'
    });

    console.log(`Created users:
- Admin: ${adminUser.email} (Password: password123)
- Staff: ${staffUser.email} (Password: password123)`);

    console.log('Seeding products...');
    const products = await Product.create([
      {
        name: 'Ergonomic Mechanical Keyboard',
        SKU: 'KB-MECH-001',
        category: 'Electronics',
        price: 89.99,
        stockQuantity: 45,
        status: 'Active'
      },
      {
        name: 'Wireless Precision Mouse',
        SKU: 'MS-WLS-002',
        category: 'Electronics',
        price: 34.5,
        stockQuantity: 60,
        status: 'Active'
      },
      {
        name: '27-inch 4K IPS Monitor',
        SKU: 'MN-4K-003',
        category: 'Electronics',
        price: 349.0,
        stockQuantity: 8, // Low stock (< 10)
        status: 'Active'
      },
      {
        name: 'USB-C Multiport Hub',
        SKU: 'HB-USBC-004',
        category: 'Accessories',
        price: 49.99,
        stockQuantity: 5, // Low stock (< 10)
        status: 'Active'
      },
      {
        name: 'Adjustable Standing Desk (Oak)',
        SKU: 'DK-STND-005',
        category: 'Furniture',
        price: 499.0,
        stockQuantity: 14,
        status: 'Active'
      },
      {
        name: 'Ergonomic Mesh Office Chair',
        SKU: 'CH-MESH-006',
        category: 'Furniture',
        price: 229.0,
        stockQuantity: 4, // Low stock (< 10)
        status: 'Active'
      },
      {
        name: 'Premium Gel Ballpoint Pens (Pack of 12)',
        SKU: 'OF-PENS-007',
        category: 'Office Supplies',
        price: 12.99,
        stockQuantity: 120,
        status: 'Active'
      },
      {
        name: 'A4 Heavy Duty Hardcover Notebook',
        SKU: 'OF-NOTE-008',
        category: 'Office Supplies',
        price: 9.5,
        stockQuantity: 85,
        status: 'Active'
      },
      {
        name: 'Noise Cancelling Wireless Headphones',
        SKU: 'AU-HEAD-009',
        category: 'Electronics',
        price: 179.99,
        stockQuantity: 18,
        status: 'Active'
      },
      {
        name: 'Legacy USB-A Cable (Discontinued)',
        SKU: 'CB-USBA-010',
        category: 'Accessories',
        price: 5.0,
        stockQuantity: 20,
        status: 'Inactive'
      }
    ]);

    console.log(`Created ${products.length} products.`);

    console.log('Seeding initial sample orders...');
    const order1 = await Order.create({
      customerName: 'Acme Global Corp',
      items: [
        {
          productId: products[0]._id,
          name: products[0].name,
          quantity: 2,
          price: products[0].price,
          subtotal: Number((products[0].price * 2).toFixed(2))
        },
        {
          productId: products[1]._id,
          name: products[1].name,
          quantity: 2,
          price: products[1].price,
          subtotal: Number((products[1].price * 2).toFixed(2))
        }
      ],
      totalAmount: Number((products[0].price * 2 + products[1].price * 2).toFixed(2)),
      orderStatus: 'Pending',
      createdBy: staffUser._id
    });

    const order2 = await Order.create({
      customerName: 'TechNova Labs',
      items: [
        {
          productId: products[4]._id,
          name: products[4].name,
          quantity: 1,
          price: products[4].price,
          subtotal: products[4].price
        }
      ],
      totalAmount: products[4].price,
      orderStatus: 'Processing',
      createdBy: staffUser._id
    });

    const order3 = await Order.create({
      customerName: 'Apex Creative Studio',
      items: [
        {
          productId: products[6]._id,
          name: products[6].name,
          quantity: 5,
          price: products[6].price,
          subtotal: Number((products[6].price * 5).toFixed(2))
        },
        {
          productId: products[7]._id,
          name: products[7].name,
          quantity: 5,
          price: products[7].price,
          subtotal: Number((products[7].price * 5).toFixed(2))
        }
      ],
      totalAmount: Number((products[6].price * 5 + products[7].price * 5).toFixed(2)),
      orderStatus: 'Delivered',
      createdBy: staffUser._id
    });

    console.log(`Created 3 sample orders (${order1._id}, ${order2._id}, ${order3._id}).`);
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
