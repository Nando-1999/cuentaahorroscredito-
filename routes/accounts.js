const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Obtener todo el Plan de Cuentas
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM chart_of_accounts ORDER BY code ASC");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Obtener balance por cuenta (Útil para reportes rápidos)
router.get('/balance/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT 
                SUM(debit) as total_debe, 
                SUM(credit) as total_haber,
                (SUM(debit) - SUM(credit)) as saldo
            FROM journal_details 
            WHERE account_code = ?`, [code]);
            
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Agregar una nueva cuenta al plan (Opcional)
router.post('/add', async (req, res) => {
    const { code, name, type } = req.body;
    try {
        await db.query(
            "INSERT INTO chart_of_accounts (code, name, type) VALUES (?, ?, ?)",
            [code, name, type]
        );
        res.json({ success: true, message: "Cuenta contable añadida" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;