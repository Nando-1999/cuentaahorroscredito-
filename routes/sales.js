const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/procesar', async (req, res) => {
    const { tipo_operacion, entity_id, total, referencia, plazo, cuota_id } = req.body;
    let conn;

    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const insertDetail = "INSERT INTO journal_details (entry_id, account_code, debit, credit) VALUES (?, ?, ?, ?)";
        const monto = parseFloat(total);

        // --- 1. DEPÓSITO ---
        if (tipo_operacion === 'deposito') {
            await conn.query("UPDATE entities SET saldo_ahorro = saldo_ahorro + ? WHERE id = ?", [monto, entity_id]);
            
            const [result] = await conn.query(
                "INSERT INTO journal_entries (entity_id, description, referencia_modulo, total) VALUES (?, ?, 'CAJA_AHORRO', ?)",
                [entity_id, `Depósito Socio ID: ${entity_id} - ${referencia}`, monto]
            );
            
            const entryId = result.insertId; 
            await conn.query(insertDetail, [entryId, '1.1.01', monto, 0]);
            await conn.query(insertDetail, [entryId, '2.1.01', 0, monto]);
        } 
        
        // --- 2. PRÉSTAMO (CON GENERACIÓN AUTOMÁTICA MEJORADA) ---
        else if (tipo_operacion === 'prestamo' || tipo_operacion === 'prestamo_desembolso') {
            await conn.query("UPDATE entities SET saldo_prestamo = saldo_prestamo + ? WHERE id = ?", [monto, entity_id]);
            
            const [result] = await conn.query(
                "INSERT INTO journal_entries (entity_id, description, referencia_modulo, total) VALUES (?, ?, 'CREDITOS', ?)",
                [entity_id, `Préstamo/Desembolso Socio ID: ${entity_id} - ${referencia}`, monto]
            );

            const entryId = result.insertId;

            // BLINDAJE: Si el plazo no viene del frontend, usamos 12 por defecto
            const numPlazo = (plazo && parseInt(plazo) > 0) ? parseInt(plazo) : 12;
            const valorCuota = monto / numPlazo;

            console.log(`Generando automáticamente ${numPlazo} cuotas para el socio ${entity_id}`);

            for (let i = 1; i <= numPlazo; i++) {
                let fechaVence = new Date();
                // Ajustamos la fecha para que cada cuota venza en meses consecutivos
                fechaVence.setMonth(fechaVence.getMonth() + i);
                
                await conn.query(
                    "INSERT INTO loan_schedule (entity_id, numero_cuota, monto_cuota, fecha_vencimiento, estado) VALUES (?, ?, ?, ?, 'PENDIENTE')",
                    [entity_id, i, valorCuota, fechaVence]
                );
            }
            
            // Asientos contables del préstamo
            await conn.query(insertDetail, [entryId, '1.1.03', monto, 0]);
            await conn.query(insertDetail, [entryId, '1.1.01', 0, monto]);
        }

        // --- 3. COBRO DE CUOTA ---
        else if (tipo_operacion === 'cobro_cuota') {
            await conn.query("UPDATE entities SET saldo_prestamo = saldo_prestamo - ? WHERE id = ?", [monto, entity_id]);
            
            if (cuota_id) {
                await conn.query(
                    "UPDATE loan_schedule SET estado = 'PAGADO', fecha_pago = NOW() WHERE id = ?", 
                    [cuota_id]
                );
            }

            const [result] = await conn.query(
                "INSERT INTO journal_entries (entity_id, description, referencia_modulo, total) VALUES (?, ?, 'RECAUDACION', ?)",
                [entity_id, `Pago Cuota - Socio ID: ${entity_id} - ${referencia}`, monto]
            );
            
            const entryId = result.insertId;
            await conn.query(insertDetail, [entryId, '1.1.01', monto, 0]);
            await conn.query(insertDetail, [entryId, '1.1.03', 0, monto]);
        }

        await conn.commit();
        res.json({ success: true, message: 'Operación procesada y cuotas generadas correctamente' });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error en sales.js:", error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;