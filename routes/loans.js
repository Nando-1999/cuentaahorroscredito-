const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Generar Tabla de Amortización (Solo cálculo, no guarda aún)
router.post('/calcular', (req, res) => {
    const { monto, tasa_anual, plazo_meses } = req.body;
    
    const tasa_mensual = (tasa_anual / 100) / 12;
    const cuota = (monto * tasa_mensual) / (1 - Math.pow(1 + tasa_mensual, -plazo_meses));
    
    let tabla = [];
    let saldo_remanente = monto;

    for (let i = 1; i <= plazo_meses; i++) {
        const interes_mes = saldo_remanente * tasa_mensual;
        const abono_capital = cuota - interes_mes;
        saldo_remanente -= abono_capital;

        tabla.push({
            mes: i,
            cuota: cuota.toFixed(2),
            interes: interes_mes.toFixed(2),
            capital: abono_capital.toFixed(2),
            saldo: Math.abs(saldo_remanente).toFixed(2)
        });
    }

    res.json({ success: true, cuota: cuota.toFixed(2), tabla });
});

// Guardar Préstamo y Generar Asiento
router.post('/crear', async (req, res) => {
    const { entity_id, monto, cuota, plazo, tasa } = req.body;
    let conn;

    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        // 1. Insertar el préstamo
        const [loan] = await conn.query(
            "INSERT INTO loans (entity_id, monto_principal, cuota_mensual, plazo_meses, tasa_interes, estado) VALUES (?, ?, ?, ?, ?, 'Activo')",
            [entity_id, monto, cuota, plazo, tasa]
        );

        // 2. Generar el asiento contable (Usamos el código de sales.js simplificado)
        const [entry] = await conn.query(
            "INSERT INTO journal_entries (description, referencia_modulo, total) VALUES (?, 'CREDITOS', ?)",
            [`Desembolso Préstamo ID: ${loan.insertId} - Socio: ${entity_id}`, monto]
        );

        // Contabilidad: 1.1.03 (Préstamos) DEBE | 1.1.01 (Caja) HABER
        await conn.query(
            "INSERT INTO journal_details (entry_id, account_code, debit, credit) VALUES (?, '1.1.03', ?, 0), (?, '1.1.01', 0, ?)",
            [entry.insertId, monto, entry.insertId, monto]
        );

        await conn.commit();
        res.json({ success: true, message: 'Préstamo desembolsado con éxito' });
    } catch (error) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

// Registrar pago de cuota
router.post('/pagar-cuota', async (req, res) => {
    const { loan_id, monto_pagado, capital, interes, mes_cuota } = req.body;
    let conn;

    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        // 1. Registrar el ingreso en la tabla de pagos (Crea esta tabla si no existe)
        await conn.query(
            "INSERT INTO loan_payments (loan_id, mes_cuota, monto, capital, interes) VALUES (?, ?, ?, ?, ?)",
            [loan_id, mes_cuota, monto_pagado, capital, interes]
        );

        // 2. Asiento Contable de Cobro
        const [entry] = await conn.query(
            "INSERT INTO journal_entries (description, referencia_modulo, total) VALUES (?, 'COBRANZAS', ?)",
            [`Pago Cuota ${mes_cuota} - Préstamo ID: ${loan_id}`, monto_pagado]
        );

        // CONTABILIDAD:
        // 1.1.01 (Caja) DEBE: Entra el dinero total
        // 1.1.03 (Préstamos) HABER: Sale el capital (reduce deuda)
        // 4.1.01 (Ingresos por Intereses) HABER: La ganancia
        await conn.query(
            `INSERT INTO journal_details (entry_id, account_code, debit, credit) VALUES 
            (?, '1.1.01', ?, 0), 
            (?, '1.1.03', 0, ?),
            (?, '4.1.01', 0, ?)`,
            [entry.insertId, monto_pagado, entry.insertId, capital, entry.insertId, interes]
        );

        await conn.commit();
        res.json({ success: true, message: "Cuota pagada correctamente" });
    } catch (error) {
        if (conn) await conn.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;