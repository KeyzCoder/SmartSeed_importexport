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
    const { year } = req.query;
    let query = `
        SELECT 
            COUNT(DISTINCT f.farmer_id) AS totalFarmers,
            SUM(f.farm_size) AS totalFarmSize,
            COALESCE(SUM(fc.bags_received), 0) AS totalMotherSeeds
        FROM farmers f
        LEFT JOIN farmer_crops fc ON f.farmer_id = fc.farmer_id
    `;
    const params = [];
    if (year) {
        query += " WHERE YEAR(fc.date_received) = ?";
        params.push(year);
    }
    db.query(query, params, (err, results) => {
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

// Update the crop breakdown endpoint with Tubigan names
// List of all municipalities in Isabela
const isabelaMunicipalities = [
    'Alicia, Isabela',
    'Angadanan, Isabela',
    'Aurora, Isabela',
    'Benito Soliven, Isabela',
    'Burgos, Isabela',
    'Cabagan, Isabela',
    'Cabatuan, Isabela',
    'City of Cauayan, Isabela',
    'Cordon, Isabela',
    'Delfin Albano, Isabela',
    'Dinapigue, Isabela',
    'Divilacan, Isabela',
    'Echague, Isabela',
    'Gamu, Isabela',
    'Ilagan City, Isabela',
    'Jones, Isabela',
    'Luna, Isabela',
    'Maconacon, Isabela',
    'Mallig, Isabela',
    'Naguilian, Isabela',
    'Palanan, Isabela',
    'Quezon, Isabela',
    'Quirino, Isabela',
    'Ramon, Isabela',
    'Reina Mercedes, Isabela',
    'Roxas, Isabela',
    'San Agustin, Isabela',
    'San Guillermo, Isabela',
    'San Isidro, Isabela',
    'San Manuel, Isabela',
    'San Mariano, Isabela',
    'San Mateo, Isabela',
    'San Pablo, Isabela',
    'Santa Maria, Isabela',
    'Santiago City, Isabela',
    'Santo Tomas, Isabela',
    'Tumauini, Isabela'
];

app.get('/api/dashboard/crop-breakdown', (req, res) => {
    const validCropTypes = [
        'NSIC Rc 216 (Tubigan 17)',
        'NSIC Rc 160',
        'NSIC Rc 300 (Tubigan 24)',
        'NSIC Rc 222 (Tubigan 18)'
    ];

    // Create a base result with all municipalities and crop types initialized to 0
    const baseResults = [];
    isabelaMunicipalities.forEach(municipality => {
        validCropTypes.forEach(cropType => {
            baseResults.push({
                address: municipality,
                crop_type: cropType,
                count: 0
            });
        });
    });

    const query = `
        SELECT 
            address,
            crop_type,
            COUNT(*) as count
        FROM farmers
        WHERE crop_type IN (?)
        GROUP BY address, crop_type
        ORDER BY address, crop_type
    `;    db.query(query, [validCropTypes], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }

        // Merge base results with actual data
        const finalResults = [...baseResults];
        results.forEach(result => {
            const index = finalResults.findIndex(base => 
                base.address === result.address && 
                base.crop_type === result.crop_type
            );
            if (index !== -1) {
                finalResults[index].count = result.count;
            }
        });

        res.json({
            success: true,
            data: finalResults
        });
    });
});

app.get('/api/dashboard/mother-seeds-distribution', (req, res) => {
    const query = `
        SELECT 
            crop_type,
            COUNT(*) as count
        FROM farmers
        WHERE crop_type IN (
            'NSIC Rc 216 (Tubigan 17)',
            'NSIC Rc 160',
            'NSIC Rc 300 (Tubigan 24)',
            'NSIC Rc 222 (Tubigan 18)'
        )
        GROUP BY crop_type
        ORDER BY crop_type
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }

        // Initialize distribution object with zeros
        const distribution = {
            rc216: 0,
            rc160: 0,
            rc300: 0,
            rc222: 0
        };

        // Map the results to our distribution object
        results.forEach(row => {
            switch (row.crop_type) {
                case 'NSIC Rc 216 (Tubigan 17)':
                    distribution.rc216 = parseInt(row.count);
                    break;
                case 'NSIC Rc 160':
                    distribution.rc160 = parseInt(row.count);
                    break;
                case 'NSIC Rc 300 (Tubigan 24)':
                    distribution.rc300 = parseInt(row.count);
                    break;
                case 'NSIC Rc 222 (Tubigan 18)':
                    distribution.rc222 = parseInt(row.count);
                    break;
            }
        });

        res.json({
            success: true,
            data: distribution
        });
    });
});

// Import and use routes
const farmersRoute = require("./routes/farmers");
app.use("/api/farmers", farmersRoute);  // Make sure this line exists and uses /api/farmers

// Import farmers from CSV
app.post('/api/farmers/import', (req, res) => {
    const { farmers } = req.body;
    
    if (!farmers || !Array.isArray(farmers) || farmers.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid or empty data provided' });
    }

    // Begin a transaction for bulk insert
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ success: false, error: 'Database connection error' });
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                console.error('Transaction error:', err);
                return res.status(500).json({ success: false, error: 'Failed to begin transaction' });
            }

            let successCount = 0;
            let failCount = 0;
            let processedCount = 0;

            // Process each farmer record
            farmers.forEach(farmer => {
                // Validate required fields
                if (!farmer.first_name || !farmer.last_name || !farmer.address || !farmer.crop_type) {
                    failCount++;
                    processedCount++;
                    
                    if (processedCount === farmers.length) {
                        finishTransaction();
                    }
                    return;
                }

                const query = `
                    INSERT INTO farmers 
                    (first_name, last_name, middle_name, extension_name, address, contact_number, crop_type, farm_size)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const params = [
                    farmer.first_name,
                    farmer.last_name,
                    farmer.middle_name || '',
                    farmer.extension_name || '',
                    farmer.address,
                    farmer.contact_number || '',
                    farmer.crop_type,
                    parseFloat(farmer.farm_size) || 0
                ];

                connection.query(query, params, (err, result) => {
                    processedCount++;
                    
                    if (err) {
                        console.error('Insert error:', err);
                        failCount++;
                    } else {
                        successCount++;
                    }

                    if (processedCount === farmers.length) {
                        finishTransaction();
                    }
                });
            });

            function finishTransaction() {
                if (failCount > 0) {
                    connection.rollback(() => {
                        connection.release();
                        return res.status(500).json({ 
                            success: false, 
                            error: `Failed to import ${failCount} records. No records were imported.` 
                        });
                    });
                } else {
                    connection.commit(err => {
                        if (err) {
                            connection.rollback(() => {
                                connection.release();
                                return res.status(500).json({ success: false, error: 'Failed to commit transaction' });
                            });
                        } else {
                            connection.release();
                            return res.json({ 
                                success: true, 
                                imported: successCount,
                                message: `Successfully imported ${successCount} farmers` 
                            });
                        }
                    });
                }
            }
        });
    });
});

// POST endpoint to add new crop data
app.post('/api/crops', (req, res) => {
    const { farmer_id, crop_type, bags_received, date_received } = req.body;

    // Validate required fields
    if (!farmer_id || !crop_type || !bags_received || !date_received) {
        return res.status(400).json({
            success: false,
            error: 'All fields are required'
        });
    }

    const query = `
        INSERT INTO farmer_crops 
        (farmer_id, crop_type, bags_received, date_received)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [farmer_id, crop_type, bags_received, date_received], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to add crop data'
            });
        }

        res.json({
            success: true,
            message: 'Crop data added successfully',
            data: {
                id: result.insertId,
                farmer_id,
                crop_type,
                bags_received,
                date_received
            }
        });
    });
});

// Update the GET endpoint to fetch crops
app.get('/api/farmers/:farmerId/crops', (req, res) => {
    const farmerId = req.params.farmerId;

    const query = `
        SELECT 
            id,
            farmer_id,
            crop_type,
            bags_received,
            DATE_FORMAT(date_received, '%Y-%m-%d') as date_received,
            created_at
        FROM farmer_crops
        WHERE farmer_id = ?
        ORDER BY date_received DESC
    `;

    db.query(query, [farmerId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch crop data'
            });
        }

        res.json(results);
    });
});

// GET specific crop
app.get('/api/crops/:id', (req, res) => {
    const cropId = req.params.id;
    
    // Check for valid ID
    if (!cropId) {
        return res.status(400).json({ success: false, error: 'Missing crop ID' });
    }
    
    const query = `
        SELECT 
            id,
            farmer_id,
            crop_type,
            bags_received,
            DATE_FORMAT(date_received, '%Y-%m-%d') as date_received
        FROM farmer_crops
        WHERE id = ?
    `;

    db.query(query, [cropId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: 'Crop not found' });
        }
        
        res.json(results[0]);
    });
});

// UPDATE specific crop
app.put('/api/crops/:id', (req, res) => {
    const cropId = req.params.id;
    const { crop_type, bags_received, date_received } = req.body;
    
    // Validate inputs
    if (!cropId || !crop_type || !bags_received || !date_received) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const query = `
        UPDATE farmer_crops
        SET crop_type = ?, bags_received = ?, date_received = ?
        WHERE id = ?
    `;
    
    db.query(query, [crop_type, bags_received, date_received, cropId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Crop not found' });
        }
        
        res.json({ success: true, message: 'Crop updated successfully' });
    });
});

// DELETE endpoint for crops
app.delete('/api/crops/:id', (req, res) => {
    const cropId = parseInt(req.params.id);
    
    // Validate crop ID
    if (isNaN(cropId)) {
        console.error('Invalid crop ID received:', req.params.id);
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid crop ID' 
        });
    }
    
    console.log('Deleting crop with ID:', cropId);
    
    const query = 'DELETE FROM farmer_crops WHERE id = ?';
    
    db.query(query, [cropId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error',
                details: err.message
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Crop not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Crop deleted successfully' 
        });
    });
});

// Update your DELETE endpoint
app.delete('/api/farmers/:farmerId/crops', (req, res) => {
    const farmerId = parseInt(req.params.farmerId);
    
    // Validate farmer ID
    if (isNaN(farmerId)) {
        console.error('Invalid farmer ID received:', req.params.farmerId);
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid farmer ID' 
        });
    }
    
    console.log('Deleting crops for farmer ID:', farmerId);
    
    const query = 'DELETE FROM farmer_crops WHERE farmer_id = ?';
    
    db.query(query, [farmerId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error',
                details: err.message
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'No crops found for this farmer' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Crops deleted successfully' 
        });
    });
});

app.get('/api/yield-history', (req, res) => {
    const query = `
        SELECT 
            year,
            province,
            ecosystem,
            SUM(value) as total_value
        FROM palay_production
        GROUP BY year, province, ecosystem
        ORDER BY year ASC, province, ecosystem
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Get unique years and provinces
        const years = [...new Set(results.map(row => row.year))];
        const provinces = [...new Set(results.map(row => row.province))];

        // Create data structure for each province
        const provinceData = {};
        provinces.forEach(province => {
            provinceData[province] = {
                irrigated: [],
                rainfed: []
            };

            // Fill data for each year
            years.forEach(year => {
                const irrigatedData = results.find(row => 
                    row.year === year && 
                    row.province === province && 
                    row.ecosystem.toLowerCase() === 'irrigated'
                );
                const rainfedData = results.find(row => 
                    row.year === year && 
                    row.province === province && 
                    row.ecosystem.toLowerCase() === 'rainfed'
                );

                provinceData[province].irrigated.push(irrigatedData ? irrigatedData.total_value : null);
                provinceData[province].rainfed.push(rainfedData ? rainfedData.total_value : null);
            });
        });

        res.json({
            years: years,
            provinces: provinceData
        });
    });
});

// Add a new guest endpoint for dashboard data
app.get('/api/dashboard/guest', (req, res) => {
    const query = `
        SELECT 
            COUNT(DISTINCT f.farmer_id) as totalFarmers,
            SUM(f.farm_size) as totalFarmSize,
            COUNT(fc.id) as totalMotherSeeds
        FROM farmers f
        LEFT JOIN farmer_crops fc ON f.farmer_id = fc.farmer_id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results[0]);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

