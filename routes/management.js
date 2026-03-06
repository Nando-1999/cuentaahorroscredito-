const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- 1. ESTADÍSTICAS DEL DASHBOARD ---
router.get('/dashboard-stats', async (req, res) => {
    try {
        const [resAhorros] = await db.query("SELECT IFNULL(SUM(saldo_ahorro), 0) as total FROM entities");
        const [resCreditos] = await db.query("SELECT IFNULL(SUM(saldo_prestamo), 0) as total FROM entities");
        const [resInmuebles] = await db.query("SELECT COUNT(*) as total FROM properties WHERE estado = 'Disponible'");

        res.json({
            ahorros: parseFloat(resAhorros[0].total || 0),
            creditos: parseFloat(resCreditos[0].total || 0),
            inmuebles: parseInt(resInmuebles[0].total || 0)
        });
    } catch (error) {
        console.error("❌ Error en dashboard-stats:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 2. LISTADO DE SOCIOS ---
router.get('/socios-lista', async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, nombre, dni_ruc, tipo, saldo_ahorro, saldo_prestamo FROM entities ORDER BY nombre ASC"
        );
        res.json(rows);
    } catch (error) {
        console.error("❌ Error en socios-lista:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 3. ÚLTIMOS MOVIMIENTOS ---
router.get('/ultimos-movimientos', async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT fecha, description, total, referencia_modulo FROM journal_entries ORDER BY fecha DESC LIMIT 6"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 4. REGISTRO DE SOCIO ---
router.post('/socio', async (req, res) => {
    try {
        const { nombre, dni, tipo } = req.body;
        const [result] = await db.query(
            "INSERT INTO entities (nombre, dni_ruc, tipo, saldo_ahorro, saldo_prestamo) VALUES (?, ?, ?, 0, 0)",
            [nombre, dni, tipo || 'Socio']
        );
        const nuevoSocioId = result.insertId;
        await db.query(
            "INSERT INTO journal_entries (entity_id, fecha, description, total, referencia_modulo) VALUES (?, NOW(), ?, 0, ?)",
            [nuevoSocioId, `Registro de nuevo ${tipo || 'Socio'} en el sistema`, 'SISTEMA']
        );
        res.json({ success: true, message: "Socio guardado y activado en historial" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 5. REGISTRAR PAGO DE CUOTA ---
router.post('/pagar-cuota', async (req, res) => {
    const { cuotaId, socioId, monto } = req.body;
    try {
        await db.query("UPDATE loan_schedule SET estado = 'PAGADA' WHERE id = ?", [cuotaId]);
        await db.query("UPDATE entities SET saldo_prestamo = saldo_prestamo - ? WHERE id = ?", [monto, socioId]);
        await db.query(
            "INSERT INTO journal_entries (entity_id, fecha, description, total, referencia_modulo) VALUES (?, NOW(), ?, ?, ?)",
            [socioId, `Pago de cuota #${cuotaId}`, monto, 'COBRANZAS']
        );
        res.json({ success: true, message: "Pago registrado con éxito" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 6. CUENTAS POR COBRAR (LISTA DE SOCIOS QUE DEBEN) ---
router.get('/cuentas-por-cobrar', async (req, res) => {
    try {
        const query = "SELECT id, nombre, dni_ruc, saldo_prestamo FROM entities WHERE saldo_prestamo > 0 ORDER BY saldo_prestamo DESC";
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 7. CUOTAS PENDIENTES DE UN SOCIO ---
router.get('/cuotas-pendientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = "SELECT id, numero_cuota, monto_cuota, fecha_vencimiento FROM loan_schedule WHERE entity_id = ? AND estado = 'PENDIENTE' ORDER BY numero_cuota ASC";
        const [rows] = await db.query(query, [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 8. REPORTE DE COBRANZAS ---
router.get('/reporte-cobranzas', async (req, res) => {
    try {
        const query = `
            SELECT ls.id, e.nombre AS socio, ls.numero_cuota, ls.monto_cuota, ls.fecha_vencimiento, DATEDIFF(ls.fecha_vencimiento, CURDATE()) AS dias_para_vencer
            FROM loan_schedule ls
            JOIN entities e ON ls.entity_id = e.id
            WHERE ls.estado = 'PENDIENTE' AND ls.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ORDER BY ls.fecha_vencimiento ASC`;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 9. KARDEX / EXPEDIENTE ---
router.get('/kardex/:id', async (req, res) => {
    const socioId = req.params.id;
    const sql = "SELECT fecha, description AS detalle, total AS monto, referencia_modulo AS referencia FROM journal_entries WHERE entity_id = ? ORDER BY fecha DESC";
    try {
        const [rows] = await db.query(sql, [socioId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/entities', async (req, res) => {
    try {
        // Usamos db.query directamente o conn.query según tu config
        const [rows] = await db.query("SELECT id, nombre, saldo_ahorro, saldo_prestamo FROM entities");
        res.json(rows);
    } catch (err) {
        console.error("Error al cargar socios:", err);
        res.status(500).json({ error: err.message });
    }
});

// RUTA PARA EL HISTORIAL COMPLETO DEL ESTADO DE CUENTA
router.get('/historial-cuotas/:entity_id', async (req, res) => {
    const { entity_id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT id, numero_cuota, monto_cuota, fecha_vencimiento, estado, fecha_pago 
             FROM loan_schedule 
             WHERE entity_id = ? 
             ORDER BY numero_cuota ASC`, 
            [entity_id]
        );
        res.json(rows);
    } catch (err) {
        console.error("Error al obtener historial:", err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// routes/management.js

router.post('/retirar-dinero', async (req, res) => {
    const { entity_id, monto, concepto } = req.body;
    let conn;

    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        // 1. Verificar si el socio existe y tiene saldo suficiente
        const [socio] = await conn.query(
            "SELECT nombre, saldo_ahorro FROM entities WHERE id = ?", 
            [entity_id]
        );

        if (!socio.length) throw new Error("Socio no encontrado");
        
        const saldoActual = parseFloat(socio[0].saldo_ahorro);
        if (saldoActual < parseFloat(monto)) {
            throw new Error(`Saldo insuficiente. Saldo disponible: $${saldoActual}`);
        }

        // 2. Restar el dinero del saldo de ahorro
        await conn.query(
            "UPDATE entities SET saldo_ahorro = saldo_ahorro - ? WHERE id = ?",
            [monto, entity_id]
        );

        // 3. Registrar el movimiento de ahorro (Tipo: RETIRO)
        await conn.query(
            "INSERT INTO savings_history (entity_id, monto, tipo, fecha, descripcion) VALUES (?, ?, 'RETIRO', NOW(), ?)",
            [entity_id, monto, concepto || 'Retiro de ahorros por ventanilla']
        );

        // 4. Asiento Contable (Opcional pero recomendado para Alejandra)
        // Debe haber un DEBE a la cuenta de Ahorros (Pasivo disminuye) 
        // y un HABER a Caja (Activo disminuye)
        
        await conn.commit();
        res.json({ success: true, message: "Retiro procesado correctamente" });

    } catch (err) {
        if (conn) await conn.rollback();
        res.status(400).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});


module.exports = router;