const db = require('../config/db');

const User = {
    create: (name, email, password, callback) => {
        db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
                 [name, email, password], callback);
    },
    findByEmail: (email, callback) => {
        db.query('SELECT * FROM users WHERE email = ?', [email], callback);
    }
};

module.exports = User;
