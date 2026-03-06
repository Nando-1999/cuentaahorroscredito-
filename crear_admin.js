const db = require('./config/db'); // Asegúrate de que la ruta a tu config sea correcta
const bcrypt = require('bcryptjs');

const crearUsuario = async () => {
    try {
        const user = 'admin';
        const pass = 'admin123'; // Esta será tu clave para el login

        // Encriptamos la clave antes de guardarla
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(pass, salt);

        const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        await db.query(sql, [user, hashedPass, 'admin']);

        console.log('---------------------------------------');
        console.log('✅ Usuario Creado Exitosamente');
        console.log(`Usuario: ${user}`);
        console.log(`Clave: ${pass}`);
        console.log('---------------------------------------');

        
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

crearUsuario();