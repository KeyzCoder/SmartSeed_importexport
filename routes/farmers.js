const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Adjust based on your actual DB config path

// Fetch all farmers with their crops (if any)
router.get("/", (req, res) => {
    const sql = `
        SELECT f.*, 
               COALESCE(SUM(fc.bags_received), 0) as total_bags_received
        FROM farmers f
        LEFT JOIN farmer_crops fc ON f.farmer_id = fc.farmer_id
        GROUP BY f.farmer_id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Fetch crops for a specific farmer
router.get("/farmer_crops/:farmer_id", (req, res) => {
    const farmerId = req.params.farmer_id;
    const sql = `
        SELECT crop_type, bags_received, date_received, predicted_yield
        FROM farmer_crops
        WHERE farmer_id = ?
    `;

    db.query(sql, [farmerId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // If no crops are found, return a 404 response
        if (results.length === 0) {
            return res.status(404).json({ error: "No crops found for this farmer." });
        }

        res.json(results);
    });
});

// Add new farmer
router.post("/", (req, res) => {
    const {
        first_name,
        last_name,
        middle_name,
        extension_name,
        address,
        contact_number,
        crop_type,
        farm_size
    } = req.body;

    const sql = `
        INSERT INTO farmers (
            first_name, last_name, middle_name, extension_name,
            address, contact_number, crop_type, farm_size
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        first_name,
        last_name,
        middle_name,
        extension_name,
        address,
        contact_number,
        crop_type,
        farm_size
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error adding farmer to database' 
            });
        }
        res.json({ 
            success: true, 
            message: 'Farmer added successfully',
            farmerId: result.insertId 
        });
    });
});

router.get("/:id", (req, res) => {
    const farmerId = req.params.id;
    const sql = `
        SELECT * FROM farmers WHERE farmer_id = ?
    `;

    db.query(sql, [farmerId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Farmer not found" });
        }

        res.json(results[0]); // Return just one object
    });
});

// Get farmer crops
router.get("/:id/crops", (req, res) => {
    const farmerId = req.params.id;
    const sql = `
        SELECT 
            crop_type,
            bags_received,
            date_received,
            predicted_yield
        FROM farmer_crops 
        WHERE farmer_id = ?
        ORDER BY date_received DESC
    `;

    db.query(sql, [farmerId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        
        res.json(results);
    });
});

// Update farmer
router.put("/:id", (req, res) => {
    const farmerId = req.params.id;
    const updateData = req.body;
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'address', 'contact_number', 'crop_type', 'farm_size'];
    for (const field of requiredFields) {
        if (!updateData[field]) {
            return res.status(400).json({
                success: false,
                error: `${field} is required`
            });
        }
    }

    const sql = 'UPDATE farmers SET ? WHERE farmer_id = ?';
    
    db.query(sql, [updateData, farmerId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Farmer not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Farmer updated successfully'
        });    });
});

// Import bulk farmers via CSV
router.post("/import", (req, res) => {
    const { farmers } = req.body;
    
    if (!farmers || !Array.isArray(farmers) || farmers.length === 0) {
        return res.status(400).json({ 
            success: false,
            error: 'Invalid farmers data' 
        });
    }

    // Begin a transaction to ensure data integrity
    db.beginTransaction(err => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database transaction failed' 
            });
        }

        let successCount = 0;
        let errorCount = 0;
        const totalCount = farmers.length;
        
        // Process each farmer record
        const processNext = (index) => {
            // If we've processed all records, commit the transaction
            if (index >= totalCount) {
                db.commit(err => {
                    if (err) {
                        console.error('Commit error:', err);
                        return db.rollback(() => {
                            res.status(500).json({ 
                                success: false, 
                                error: 'Failed to commit transaction' 
                            });
                        });
                    }
                    
                    // Return success response with counts
                    return res.json({
                        success: true,
                        message: 'Import completed',
                        imported: successCount,
                        failed: errorCount,
                        total: totalCount
                    });
                });
                return;
            }
            
            const farmer = farmers[index];
            
            // SQL query to insert farmer
            const sql = `
                INSERT INTO farmers (
                    first_name, last_name, middle_name, extension_name,
                    address, contact_number, crop_type, farm_size
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                farmer.first_name,
                farmer.last_name,
                farmer.middle_name || '',
                farmer.extension_name || '',
                farmer.address,
                farmer.contact_number || '',
                farmer.crop_type,
                farmer.farm_size || 0
            ];
            
            // Execute the insert
            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Insert error for record:', index, err);
                    errorCount++;
                } else {
                    successCount++;
                }
                
                // Process next record regardless of success/failure
                processNext(index + 1);
            });
        };
        
        // Start processing with the first record
        processNext(0);
    });
});

module.exports = router;
