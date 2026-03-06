// config/db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root', // Tu contraseña de XAMPP/MySQL
    database: 'sistema_con', // <--- Asegúrate de que esté escrito así, en minúsculas
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool.promise();