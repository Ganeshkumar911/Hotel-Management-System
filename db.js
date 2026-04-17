const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'hotel.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to regular database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table for customers and owners
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer', 
      phone TEXT,
      address TEXT
    )`);

    // Rooms
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      price REAL NOT NULL,
      status TEXT DEFAULT 'available' -- available, booked, maintenance
    )`);

    // Bookings (Rent Management)
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      room_id INTEGER,
      check_in DATE,
      check_out DATE,
      total_rent REAL,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (room_id) REFERENCES rooms (id)
    )`);

    // Complaints
    db.run(`CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Contacts
    db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT
    )`);
    
    // Food Menu
    db.run(`CREATE TABLE IF NOT EXISTS food_menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT DEFAULT 'general',
      image_url TEXT
    )`);

    // Food Orders
    db.run(`CREATE TABLE IF NOT EXISTS food_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      room_number TEXT,
      total_amount REAL,
      status TEXT DEFAULT 'pending',
      order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Food Order Items
    db.run(`CREATE TABLE IF NOT EXISTS food_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      food_id INTEGER,
      quantity INTEGER,
      price REAL,
      FOREIGN KEY (order_id) REFERENCES food_orders (id),
      FOREIGN KEY (food_id) REFERENCES food_menu (id)
    )`);
    
    // Seed an owner and some rooms if none exist
    db.get('SELECT count(*) as count FROM users', (err, row) => {
      if (row && row.count === 0) {
        // Will be seeded from server or just empty
      }
    });

    db.get('SELECT count(*) as count FROM rooms', (err, row) => {
      if (row && row.count === 0) {
        const stmt = db.prepare('INSERT INTO rooms (room_number, type, price) VALUES (?, ?, ?)');
        for(let i=101; i<=110; i++) stmt.run(i.toString(), 'Single', 1000);
        for(let i=201; i<=210; i++) stmt.run(i.toString(), 'Double', 2000);
        for(let i=301; i<=305; i++) stmt.run(i.toString(), 'Suite', 5000);
        stmt.finalize();
      }
    });

    db.get('SELECT count(*) as count FROM food_menu', (err, row) => {
      if (row && row.count === 0) {
        const stmt = db.prepare('INSERT INTO food_menu (name, description, price, category) VALUES (?, ?, ?, ?)');
        
        const tnFoods = [
          ['Idli (2 pcs)', 'Steamed rice cakes served with sambar and chutney', 40, 'Breakfast'],
          ['Masala Dosa', 'Crispy crepe filled with potato masala', 80, 'Breakfast'],
          ['Medu Vada (2 pcs)', 'Crispy lentil doughnuts', 50, 'Breakfast'],
          ['Pongal', 'Rice and lentils cooked with black pepper and cumin', 70, 'Breakfast'],
          ['South Indian Thali', 'Rice, sambar, rasam, kootu, poriyal, curd, appalam', 150, 'Lunch'],
          ['Chicken Chettinad', 'Spicy Chettinad style chicken curry', 220, 'Dinner'],
          ['Mutton Chukka', 'Dry roasted mutton with pepper and spices', 300, 'Dinner'],
          ['Filter Coffee', 'Traditional South Indian filter coffee', 30, 'Beverage']
        ];

        tnFoods.forEach(food => {
          stmt.run(food[0], food[1], food[2], food[3]);
        });
        stmt.finalize();
      }
    });
  });
}

module.exports = db;
