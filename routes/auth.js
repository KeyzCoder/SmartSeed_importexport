const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Add this function at the top of the file after the imports
function validatePassword(password) {
    // Minimum 8 characters, at least one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}

// Basic test route to verify the router is working
router.get('/test', (req, res) => {
    res.json({ message: 'Auth router is working' });
});

// User Registration
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Store password directly (not recommended for production)
    db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
        [name, email, password], 
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'User registered' });
        }
    );
});

// User Login with reCAPTCHA
router.post('/login', async (req, res) => {
    try {
        const { email, password, captchaResponse } = req.body;
        console.log('Login attempt for:', email);

        // Verify reCAPTCHA first
        if (!captchaResponse) {
            return res.status(400).json({
                success: false,
                
            });
        }

        // Verify with Google reCAPTCHA API
        const recaptchaVerify = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY || 'your-secret-key',
                    response: captchaResponse
                }
            }
        );

        if (!recaptchaVerify.data.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid captcha. Please try again'
            });
        }

        // Continue with regular login process
        const sql = 'SELECT id, name, email, password FROM users WHERE email = ? AND password = ?';
        
        db.query(sql, [email, password], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Database error occurred' 
                });
            }

            if (results.length === 0) {
                console.log('No user found with email:', email);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid email or password' 
                });
            }

            const user = results[0];
            
            // Create JWT token
            const token = jwt.sign(
                { id: user.id }, 
                'smartseed-secret-key',
                { expiresIn: '24h' }
            );

            // Send success response
            res.json({ 
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error occurred' 
        });
    }
});

module.exports = router;
