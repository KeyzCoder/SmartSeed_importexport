const express = require("express");
const mysql = require("mysql2"); // Use mysql2 instead of mysql
const dotenv = require("dotenv");
const path = require("path");
const axios = require('axios');

dotenv.config();
const app = express();
app.use(express.static("public"));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

app.use(express.static('SmartSeed_FFF'));

app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL");
});



app.get("/", (req, res) => {
    res.send("Server is running...");
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password, captchaResponse } = req.body;

        // Verify CAPTCHA first
        //if (!captchaResponse) {
        //    return res.status(400).json({
        //        success: false,
        //        error: 'CAPTCHA is required'
        //    });
        //}

        // Verify with Google reCAPTCHA API
        const recaptchaVerify = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: captchaResponse
                }
            }
        );

        //if (!recaptchaVerify.data.success) {
        //    return res.status(400).json({
        //        success: false,
        //        error: 'Invalid CAPTCHA verification'
        //    });
        //}

        // Continue with regular login process
        const query = "SELECT * FROM users WHERE email = ? AND password = ?";
        
        db.query(query, [email, password], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json({ success: false, error: "Database error" });
            }

            if (results.length === 0) {
                return res.status(401).json({ success: false, error: "Invalid credentials" });
            }

            const user = results[0];
            res.json({ 
                success: true, 
                message: "Login successful",
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

app.get('/api/dashboard/stats', (req, res) => {
    const query = `
        SELECT 
            COUNT(DISTINCT f.farmer_id) AS totalFarmers,
            SUM(f.farm_size) AS totalFarmSize,
            COALESCE(SUM(fc.bags_received), 0) AS totalMotherSeeds
        FROM farmers f
        LEFT JOIN farmer_crops fc ON f.farmer_id = fc.farmer_id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        const stats = results[0];
        res.json({
            success: true,
            totalFarmers: stats.totalFarmers || 0,
            totalFarmSize: parseFloat(stats.totalFarmSize || 0).toFixed(2),
            totalMotherSeeds: stats.totalMotherSeeds || 0
        });
    });
});

// Import and use routes
const farmersRoute = require("./routes/farmers");
app.use("/api/farmers", farmersRoute);  // Make sure this line exists and uses /api/farmers

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

