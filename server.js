const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Authentication: Register
app.post('/api/register', async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'owner' ? 'owner' : 'customer';

    db.run(
      `INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, userRole, phone || '', address || ''],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already registered' });
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Authentication: Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // In a real app we'd use JWT. Keeping simple here.
    const userProfile = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address };
    res.json({ message: 'Login successful', user: userProfile });
  });
});

// Profile Management
app.get('/api/users/:id', (req, res) => {
  db.get('SELECT id, name, email, role, phone, address FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

// Rooms Management
app.get('/api/rooms', (req, res) => {
  db.all('SELECT * FROM rooms', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.post('/api/rooms', (req, res) => {
  const { room_number, type, price } = req.body;
  db.run(`INSERT INTO rooms (room_number, type, price) VALUES (?, ?, ?)`, [room_number, type, price], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json({ id: this.lastID, room_number, type, price, status: 'available' });
  });
});

// Rent Management (Bookings)
app.post('/api/bookings', (req, res) => {
  const { user_id, room_id, check_in, check_out, total_rent } = req.body;
  db.run(`INSERT INTO bookings (user_id, room_id, check_in, check_out, total_rent) VALUES (?, ?, ?, ?, ?)`, 
    [user_id, room_id, check_in, check_out, total_rent], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    // Update room status
    db.run(`UPDATE rooms SET status = 'booked' WHERE id = ?`, [room_id]);
    res.status(201).json({ message: 'Room booked successfully', bookingId: this.lastID });
  });
});

app.get('/api/bookings', (req, res) => {
  const userId = req.query.user_id;
  let query = `
    SELECT b.*, r.room_number, r.type 
    FROM bookings b 
    JOIN rooms r ON b.room_id = r.id
  `;
  const params = [];
  if (userId) {
    query += ' WHERE b.user_id = ?';
    params.push(userId);
  }
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Complaints
app.post('/api/complaints', (req, res) => {
  const { user_id, title, description } = req.body;
  db.run(`INSERT INTO complaints (user_id, title, description) VALUES (?, ?, ?)`, [user_id, title, description], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json({ message: 'Complaint registered' });
  });
});

app.get('/api/complaints', (req, res) => {
  db.all('SELECT c.*, u.name as user_name FROM complaints c LEFT JOIN users u ON c.user_id = u.id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Contact
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  db.run(`INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`, [name, email, message], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json({ message: 'Message sent' });
  });
});

// Food Menu & Ordering
app.get('/api/food/menu', (req, res) => {
  db.all('SELECT * FROM food_menu', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.post('/api/food/order', (req, res) => {
  const { user_id, room_number, items, total_amount } = req.body;
  db.run(`INSERT INTO food_orders (user_id, room_number, total_amount) VALUES (?, ?, ?)`, 
    [user_id, room_number, total_amount], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    const order_id = this.lastID;
    
    // Insert items
    if (items && items.length > 0) {
      const stmt = db.prepare('INSERT INTO food_order_items (order_id, food_id, quantity, price) VALUES (?, ?, ?, ?)');
      items.forEach(item => {
        stmt.run(order_id, item.food_id, item.quantity, item.price);
      });
      stmt.finalize();
    }
    
    res.status(201).json({ message: 'Food order placed successfully', orderId: order_id });
  });
});

app.get('/api/food/orders', (req, res) => {
  const userId = req.query.user_id;
  let query = 'SELECT * FROM food_orders';
  const params = [];
  if (userId) {
    query += ' WHERE user_id = ?';
    params.push(userId);
  }
  query += ' ORDER BY order_time DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
