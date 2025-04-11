const mysql = require('mysql2');
//require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Test connection immediately
db.connect(err => {
    if (err) {
        console.error('MySQL Connection Error:', err);
        throw err;
    }
    console.log('Connected to MySQL database');
    
    // Validate database structure
    db.query('SHOW TABLES', (err, results) => {
        if (err) {
            console.error('Error checking tables:', err);
            return;
        }
        console.log('Available tables:', results.map(r => Object.values(r)[0]).join(', '));
    });
});

module.exports = db;