const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/libro-diario', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.fecha, e.description, d.account_code, d.debit, d.credit 
            FROM journal_entries e 
            JOIN journal_details d ON e.id = d.entry_id 
            ORDER BY e.fecha DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;