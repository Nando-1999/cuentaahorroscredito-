// routes/accounting.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/deposito', async (req, res) => {
    const { entity_id, monto, concepto } = req.body;
    
    // Iniciamos una transacción para seguridad financiera
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Actualizar saldo del socio
        await connection.query(
            "UPDATE entities SET saldo_ahorro = saldo_ahorro + ? WHERE id = ?",
            [monto, entity_id]
        );

        // 2. Crear cabecera del asiento contable (Libro Diario)
        const [entry] = await connection.query(
            "INSERT INTO journal_entries (entry_date, description, total_amount) VALUES (NOW(), ?, ?)",
            [`Depósito Socio ID: ${entity_id} - ${concepto}`, monto]
        );

        // 3. Registrar el detalle (Debe/Haber)
        // Aquí podrías configurar tus cuentas contables (Caja vs Ahorros)
        
        await connection.commit();
        res.json({ success: true, message: 'Depósito procesado y saldo actualizado' });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;