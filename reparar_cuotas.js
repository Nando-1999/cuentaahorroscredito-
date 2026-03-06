const db = require('./config/db');

async function reparar() {
    let conn;
    try {
        conn = await db.getConnection();
        // Buscamos socios que tienen saldo_prestamo pero no tienen cuotas en loan_schedule
        const [socios] = await conn.query(`
            SELECT id, nombre, saldo_prestamo 
            FROM entities 
            WHERE saldo_prestamo > 0 
            AND id NOT IN (SELECT DISTINCT entity_id FROM loan_schedule)
        `);

        console.log(`Encontrados ${socios.length} socios para reparar.`);

        for (let socio of socios) {
            const plazo = 12; // Supongamos 12 meses para los antiguos
            const montoCuota = socio.saldo_prestamo / plazo;

            for (let i = 1; i <= plazo; i++) {
                let fechaVence = new Date();
                fechaVence.setMonth(fechaVence.getMonth() + i);
                
                await conn.query(
                    "INSERT INTO loan_schedule (entity_id, numero_cuota, monto_cuota, fecha_vencimiento, estado) VALUES (?, ?, ?, ?, 'PENDIENTE')",
                    [socio.id, i, montoCuota, fechaVence]
                );
            }
            console.log(`✅ Cuotas generadas para: ${socio.nombre}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

reparar();