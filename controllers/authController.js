const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("--- INTENTO DE LOGIN ---");
        console.log("Usuario recibido:", username);
        console.log("Password recibida:", password);

        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            console.log("❌ Resultado: Usuario no existe en DB");
            return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
        }

        const user = rows[0];
        console.log("Hash encontrado en DB:", user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("¿Coinciden?:", isMatch);

        if (!isMatch) {
            console.log("❌ Resultado: Contraseña no coincide");
            return res.status(400).json({ success: false, message: 'Contraseña incorrecta' });
        }

        console.log("✅ Resultado: LOGIN EXITOSO");
        res.json({ success: true, message: 'Bienvenido', user: { id: user.id, username: user.username } });

    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};