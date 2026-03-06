const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/dashboard-summary', async (req, res) => {
    try {
        // 1. Suma de saldos de socios
        const [ahorros] = await db.query("SELECT SUM(saldo_ahorro) as total FROM entities");
        
        // 2. Conteo de inmuebles disponibles
        const [inmuebles] = await db.query("SELECT COUNT(*) as total FROM properties WHERE estado = 'Disponible'");
        
        // 3. Saldo en Caja (Contabilidad)
        const [caja] = await db.query(
            "SELECT SUM(debit) - SUM(credit) as balance FROM journal_details WHERE account_code = '1.1.01'"
        );

        res.json({
            success: true,
            totalAhorros: ahorros[0].total || 0,
            disponibles: inmuebles[0].total || 0,
            saldoCaja: caja[0].balance || 0
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;