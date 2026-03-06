const db = require('../config/db');

// Listar con cálculo de saldo para el Dashboard
exports.listar = async (req, res) => {
    try {
        // Traemos el saldo explícitamente para alimentar los KPIs de tu ERP
        const [rows] = await db.query('SELECT id, ruc_cedula, razon_social, email, telefono, tipo_proveedor, saldo FROM proveedores ORDER BY razon_social ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener proveedores: ' + error.message });
    }
};

// Crear con validación técnica
exports.crear = async (req, res) => {
    const { ruc, razon_social, email, telefono, direccion, tipo_proveedor } = req.body;
    
    // Validación básica de RUC (10 o 13 dígitos para Ecuador)
    if (!ruc || (ruc.length !== 10 && ruc.length !== 13)) {
        return res.status(400).json({ error: 'El RUC o Cédula debe tener 10 o 13 dígitos' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO proveedores (ruc_cedula, razon_social, email, telefono, direccion, tipo_proveedor, saldo) VALUES (?, ?, ?, ?, ?, ?, 0.00)',
            [ruc, razon_social, email, telefono, direccion, tipo_proveedor || 'Juridica']
        );
        
        // Devolvemos el ID generado para que el módulo de Compras pueda usarlo
        res.json({ 
            message: 'Proveedor registrado correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Este RUC ya se encuentra registrado' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};