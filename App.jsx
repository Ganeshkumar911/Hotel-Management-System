import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Hotel, User, LogIn, LogOut, MessageSquare, Phone, Home, CreditCard, Coffee } from 'lucide-react';
import axios from 'axios';

// --- Auth Context & API Utils ---
const API_URL = 'http://localhost:5000/api';

// --- Components ---

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <Hotel color="#4F46E5" /> LuxeSTAY
      </Link>
      <div className="nav-links">
        <Link to="/"><Home size={18}/> Home</Link>
        <Link to="/rooms"><CreditCard size={18}/> Rent Rooms</Link>
        <Link to="/food"><Coffee size={18}/> Order Food</Link>
        <Link to="/complaints"><MessageSquare size={18}/> Complaints</Link>
        <Link to="/contact"><Phone size={18}/> Contact</Link>
        {user ? (
          <>
            <Link to="/profile"><User size={18}/> Profile</Link>
            <button onClick={handleLogout} className="btn btn-outline" style={{padding: '0.3rem 0.8rem'}}>
              <LogOut size={16}/> Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{padding: '0.4rem 1rem'}}>
            <LogIn size={16}/> Login
          </Link>
        )}
      </div>
    </nav>
  );
};

const HomePage = () => (
  <div className="hero">
    <div className="hero-content">
      <h1>Experience Ultimate Luxury</h1>
      <p>Manage your bookings, register complaints, and experience seamless hospitality seamlessly.</p>
      <Link to="/rooms" className="btn btn-primary">Book Your Stay</Link>
    </div>
  </div>
);

const LoginPage = ({ setUser }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await axios.post(`${API_URL}/register`, formData);
        alert('Registration successful! Please login.');
        setIsRegister(false);
      } else {
        const res = await axios.post(`${API_URL}/login`, { email: formData.email, password: formData.password });
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="form-container">
      <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        {isRegister && (
          <div className="form-group">
            <label>Name</label>
            <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required={isRegister} />
          </div>
        )}
        <div className="form-group">
          <label>Email</label>
          <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
        </div>
        {isRegister && (
          <div className="form-group">
            <label>Role</label>
            <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="customer">Customer / Guest</option>
              <option value="owner">Owner</option>
            </select>
          </div>
        )}
        <button type="submit" className="btn btn-primary" style={{width: '100%', marginBottom: '1rem'}}>
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>
        {isRegister ? 'Already registered?' : 'Need an account?'} {' '}
        <span style={{color: 'var(--accent)', cursor: 'pointer'}} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Login here' : 'Register here'}
        </span>
      </p>
      <Link to="/" className="btn btn-outline" style={{width: '100%', display: 'flex', justifyContent: 'center', marginTop: '1rem'}}>
        Back to Home
      </Link>
    </div>
  );
};

const ProfilePage = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);
  
  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/bookings?user_id=${user.id}`).then(res => setBookings(res.data));
      axios.get(`${API_URL}/food/orders?user_id=${user.id}`).then(res => setFoodOrders(res.data));
    }
  }, [user]);

  if (!user) return <div className="page-container">Please login to view profile.</div>;

  return (
    <div className="page-container">
      <h2>Profile Details</h2>
      <div className="card" style={{marginBottom: '2rem'}}>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> <span style={{textTransform: 'capitalize'}}>{user.role}</span></p>
      </div>

      <h3>{user.role === 'owner' ? 'All Hotel Bookings' : 'Your Bookings'}</h3>
      <div className="table-container" style={{marginBottom: '2rem'}}>
        <table>
          <thead>
            <tr>
              <th>Room No</th>
              <th>Type</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Total Rent</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? bookings.map(b => (
              <tr key={b.id}>
                <td>{b.room_number}</td>
                <td>{b.type}</td>
                <td>{b.check_in}</td>
                <td>{b.check_out}</td>
                <td>${b.total_rent}</td>
              </tr>
            )) : <tr><td colSpan="5">No bookings found.</td></tr>}
          </tbody>
        </table>
      </div>

      <h3>{user.role === 'owner' ? 'All Food Orders' : 'Your Food Orders'}</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Room No</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Order Time</th>
            </tr>
          </thead>
          <tbody>
            {foodOrders.length > 0 ? foodOrders.map(o => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.room_number}</td>
                <td>₹{o.total_amount}</td>
                <td><span style={{textTransform: 'capitalize', color: o.status === 'pending' ? 'var(--warning)' : 'var(--success)'}}>{o.status}</span></td>
                <td>{new Date(o.order_time).toLocaleString()}</td>
              </tr>
            )) : <tr><td colSpan="5">No food orders found.</td></tr>}
          </tbody>
        </table>
      </div>
      
      <Link to="/" className="btn btn-outline" style={{marginTop: '1rem'}}>Back to Home</Link>
    </div>
  );
};

const RoomsPage = ({ user }) => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/rooms`).then(res => setRooms(res.data));
  }, []);

  const handleBook = async (roomId, price) => {
    if (!user) return alert('Please login to book a room.');
    try {
      await axios.post(`${API_URL}/bookings`, {
        user_id: user.id,
        room_id: roomId,
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        total_rent: price
      });
      alert('Room booked successfully!');
      axios.get(`${API_URL}/rooms`).then(res => setRooms(res.data));
    } catch (err) {
      alert('Failed to book room');
    }
  };

  return (
    <div className="page-container">
      <h2>Room Rent Management</h2>
      <div className="grid-cards">
        {rooms.map(room => (
          <div key={room.id} className="card">
            <h3>Room {room.room_number}</h3>
            <p style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>Type: {room.type}</p>
            <p style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem'}}>${room.price} <span style={{fontSize: '1rem', fontWeight: 'normal'}}>/ night</span></p>
            <p style={{marginBottom: '1rem'}}>Status: <span style={{color: room.status === 'available' ? 'var(--success)' : 'var(--danger)'}}>{room.status}</span></p>
            <button 
              className="btn btn-primary" 
              style={{width: '100%'}} 
              disabled={room.status !== 'available'}
              onClick={() => handleBook(room.id, room.price)}
            >
              {room.status === 'available' ? 'Book Now' : 'Not Available'}
            </button>
          </div>
        ))}
      </div>
      <Link to="/" className="btn btn-outline" style={{marginTop: '1rem'}}>Back to Home</Link>
    </div>
  );
};

const ComplaintsPage = ({ user }) => {
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    axios.get(`${API_URL}/complaints`).then(res => setComplaints(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please login to submit a complaint.');
    try {
      await axios.post(`${API_URL}/complaints`, { ...formData, user_id: user.id });
      alert('Complaint registered successfully.');
      setFormData({ title: '', description: '' });
      axios.get(`${API_URL}/complaints`).then(res => setComplaints(res.data));
    } catch (err) {
      alert('Submit failed');
    }
  };

  return (
    <div className="page-container">
      <h2>Complaints Management</h2>
      <div className="form-container" style={{margin: '0 0 3rem 0', maxWidth: '600px'}}>
        <h3>Register a Complaint</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subject / Title</label>
            <input type="text" className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
          </div>
          <button type="submit" className="btn btn-primary">Submit Complaint</button>
        </form>
      </div>

      <h3>Recent Complaints</h3>
      <div className="grid-cards" style={{padding: '1rem 0'}}>
        {complaints.map(c => (
          <div key={c.id} className="card">
            <h4>{c.title}</h4>
            <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>By: {c.user_name}</p>
            <p style={{marginTop: '1rem'}}>{c.description}</p>
            <span style={{display: 'inline-block', marginTop: '1rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', fontSize: '0.8rem'}}>{c.status}</span>
          </div>
        ))}
      </div>
      <Link to="/" className="btn btn-outline" style={{marginTop: '1rem'}}>Back to Home</Link>
    </div>
  );
};

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/contact`, formData);
      alert('Message sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      alert('Failed to send message');
    }
  };

  return (
    <div className="page-container">
      <h2>Contact Us</h2>
      <div className="form-container" style={{margin: '2rem auto'}}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea className="form-control" rows="5" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Send Message</button>
        </form>
        <Link to="/" className="btn btn-outline" style={{width: '100%', display: 'flex', justifyContent: 'center', marginTop: '1rem'}}>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

const FoodPage = ({ user }) => {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [roomNumber, setRoomNumber] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/food/menu`).then(res => setMenu(res.data));
  }, []);

  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(i => i.id !== itemId));
  };

  const handleOrder = async () => {
    if (!user) return alert('Please login to order food.');
    if (!roomNumber) return alert('Please enter your room number.');
    if (cart.length === 0) return alert('Your cart is empty.');

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderItems = cart.map(item => ({ food_id: item.id, quantity: item.quantity, price: item.price }));

    try {
      await axios.post(`${API_URL}/food/order`, {
        user_id: user.id,
        room_number: roomNumber,
        items: orderItems,
        total_amount: totalAmount
      });
      alert('Food ordered successfully!');
      setCart([]);
      setRoomNumber('');
    } catch (err) {
      alert('Failed to place order');
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="page-container">
      <h2>Tamil Nadu Food Menu</h2>
      <div className="grid-cards">
        {menu.map(item => (
          <div key={item.id} className="card">
            <h3>{item.name}</h3>
            <p style={{color: 'var(--text-muted)'}}>{item.category}</p>
            <p style={{marginBottom: '1rem'}}>{item.description}</p>
            <p style={{fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem'}}>₹{item.price}</p>
            <button className="btn btn-primary" onClick={() => addToCart(item)}>Add to Cart</button>
          </div>
        ))}
      </div>

      <div className="card" style={{marginTop: '3rem'}}>
        <h3>Your Order (Cart)</h3>
        {cart.length > 0 ? (
          <div>
            <ul>
              {cart.map(item => (
                <li key={item.id} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius:'0.25rem'}}>
                  <span>{item.quantity}x {item.name}</span>
                  <div>
                    <span style={{marginRight: '1rem'}}>₹{item.price * item.quantity}</span>
                    <button onClick={() => removeFromCart(item.id)} className="btn btn-outline" style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)'}}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
            <div style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
              <strong>Total: ₹{total}</strong>
            </div>
            <div className="form-group" style={{marginTop: '1rem'}}>
              <label>Room Number</label>
              <input type="text" className="form-control" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. 101" required />
            </div>
            <button className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} onClick={handleOrder}>Place Order</button>
          </div>
        ) : <p style={{color: 'var(--text-muted)'}}>Your cart is empty.</p>}
      </div>
      <Link to="/" className="btn btn-outline" style={{marginTop: '1rem'}}>Back to Home</Link>
    </div>
  );
};

// --- App Root Component ---
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/profile" element={<ProfilePage user={user} />} />
        <Route path="/rooms" element={<RoomsPage user={user} />} />
        <Route path="/food" element={<FoodPage user={user} />} />
        <Route path="/complaints" element={<ComplaintsPage user={user} />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Router>
  );
}

export default App;
