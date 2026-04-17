const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'hotel.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('DELETE FROM rooms'); // Clear existing rooms
  
  const stmt = db.prepare('INSERT INTO rooms (room_number, type, price) VALUES (?, ?, ?)');
  
  // Single Rooms
  for(let i=101; i<=120; i++) stmt.run(i.toString(), 'Single', 1000);
  // Double Rooms
  for(let i=201; i<=220; i++) stmt.run(i.toString(), 'Double', 2000);
  // Suite Rooms
  for(let i=301; i<=310; i++) stmt.run(i.toString(), 'Suite', 5000);
  
  stmt.finalize(() => {
    console.log('Successfully seeded 50 rooms into the database.');
    db.close();
  });
});
