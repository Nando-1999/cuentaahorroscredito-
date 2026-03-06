const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARES ---
app.use(cors());
app.use(express.json()); // Importante: Debe ir antes de las rutas
app.use(express.static('public'));

// --- IMPORTACIÓN DE RUTAS ---
// Se eliminaron las declaraciones duplicadas para corregir el SyntaxError
const managementRoutes = require('./routes/management');
const salesRoutes = require('./routes/sales');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const entryRoutes = require('./routes/entries');
const journalRoutes = require('./routes/journal');

// --- DEFINICIÓN DE ENDPOINTS (API) ---

// Rutas de Identidad y Contabilidad Base
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/entries', entryRoutes);

// Rutas del Negocio: Caja e Inmobiliaria
app.use('/api/sales', salesRoutes);
app.use('/api/gestion', managementRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/management', require('./routes/management'));

// Ruta base para verificación
app.get('/', (req, res) => {
    res.send('🚀 ERP Caja e Inmobiliaria Funcionando | Quito, Ecuador');
});

// --- MANEJO DE ERRORES GLOBAL ---
app.use((err, req, res, next) => {
    console.error('❌ ERROR EN EL SERVIDOR:', err.stack);
    res.status(500).send({ 
        success: false, 
        error: 'Algo salió mal en el servidor!',
        details: err.message 
    });
});

// --- ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('-----------------------------------------');
    console.log(`✅ Sistema ContaSistemas Activo`);
    console.log(`📍 Acceso: http://localhost:${PORT}`);
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    console.log('-----------------------------------------');
});