const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/historial', async (req, res) => {
    try {
        // SQL Corregido: usamos 'fecha' según tu captura de Result Grid
        const query = `
            SELECT 
                je.id, 
                je.fecha, 
                je.description, 
                je.referencia_modulo, 
                je.total,
                jd.account_code as cuenta,
                jd.debit as debe,
                jd.credit as haber
            FROM journal_entries je
            LEFT JOIN journal_details jd ON je.id = jd.entry_id
            ORDER BY je.fecha DESC, je.id DESC
        `;
        
        const [rows] = await db.query(query);

        // Si no hay datos, devolvemos un array vacío para que el front no explote
        if (!rows || rows.length === 0) {
            return res.json([]);
        }

        // Agrupamos los detalles por asiento
        const historial = rows.reduce((acc, row) => {
            const found = acc.find(item => item.id === row.id);
            const detalle = { cuenta: row.cuenta, debe: row.debe, haber: row.haber };
            
            if (found) {
                found.detalles.push(detalle);
            } else {
                acc.push({
                    id: row.id,
                    fecha: row.fecha,
                    description: row.description,
                    referencia_modulo: row.referencia_modulo,
                    total: row.total,
                    detalles: [detalle]
                });
            }
            return acc;
        }, []);

        res.json(historial);
    } catch (error) {
        console.error("Error en API Diario:", error);
        // Enviamos el error como JSON para evitar el "Unexpected token <"
        res.status(500).json({ error: "Error en el servidor", detalle: error.message });
    }
});

module.exports = router;