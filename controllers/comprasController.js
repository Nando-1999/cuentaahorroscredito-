const db = require('../config/db');

exports.registrarCompra = async (req, res) => {
    const { proveedor_id, numero_factura, total, fecha } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insertar la compra
        await connection.query(
            'INSERT INTO compras (proveedor_id, numero_factura, total, fecha_emision, estado) VALUES (?, ?, ?, ?, "Pendiente")',
            [proveedor_id, numero_factura, total, fecha]
        );

        // 2. LOGICA ERP: Actualizar el saldo del proveedor automáticamente
        await connection.query(
            'UPDATE proveedores SET saldo = saldo + ? WHERE id = ?',
            [total, proveedor_id]
        );

        // 3. ASIENTO CONTABLE: Afectar el Libro Diario (Pasivo)
        const glosa = `Compra s/n Factura #${numero_factura}`;
        await connection.query(
            'INSERT INTO libro_diario (glosa, cuenta_id, debe, haber, referencia_tipo) VALUES (?, ?, ?, ?, ?)',
            [glosa, 2, 0, total, 'Compra'] // ID 2 = PASIVO en tu tabla accounts
        );

        await connection.commit();
        res.json({ success: true, message: 'Compra y Saldo actualizados' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};