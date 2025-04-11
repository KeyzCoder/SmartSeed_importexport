const express = require("express");
const mysql = require("mysql2"); // Use mysql2 instead of mysql
const dotenv = require("dotenv");
const path = require("path");

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

app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Query the `users` table in the `smartseed` database
    const query = " * FROM users WHERE email = ? AND password = ?";
    
    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        if (results.length === 0) {
            return res.json({ success: false, error: "Invalid credentials" });
        }

        // User found
        const user = results[0];

        // Send response
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
});

const farmersRoute = require("./routes/farmers");
app.use("/api/farmers", farmersRoute);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

