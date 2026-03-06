const db = require('./config/db');

async function test() {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        console.log('✅ ¡Conexión exitosa! Resultado:', rows[0].result);
        process.exit();
    } catch (err) {
        console.error('❌ Error de conexión:', err.message);
        process.exit(1);
    }
}
test();