/**
 * FACTURADOR CORE V2.1 - CONTASISTEMAS S.A.
 * Diseño Vanguardista para Quito, Ecuador.
 */

async function generarPDFVanguardista(tipo, cliente, items, sub, iva, tot) {
    const facturaHtml = document.createElement('div');
    facturaHtml.style.padding = "0"; // Quitamos padding inicial para usar contenedores internos
    facturaHtml.style.width = "750px";
    facturaHtml.style.background = "#ffffff";
    facturaHtml.style.fontFamily = "'Plus Jakarta Sans', sans-serif";

    facturaHtml.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 45px; color: white; position: relative; overflow: hidden;">
            <div style="position: absolute; right: -20px; top: -20px; font-size: 150px; font-weight: 900; opacity: 0.05; color: white; pointer-events: none;">
                ${tipo === 'factura' ? 'FAC' : 'COT'}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1;">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div style="background: #3b82f6; width: 35px; height: 35px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-weight: 900; font-size: 20px;">C</span>
                        </div>
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">CONTASISTEMAS S.A.</h1>
                    </div>
                    <p style="margin: 0; font-size: 12px; opacity: 0.8; font-weight: 500;">RUC: 1792XXXXXX001 • Quito, Ecuador</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">soporte@contasistemas.com</p>
                </div>
                <div style="text-align: right;">
                    <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(5px); padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);">
                        <p style="margin: 0; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #3b82f6;">${tipo === 'factura' ? 'Factura Electrónica' : 'Cotización'}</p>
                        <h2 style="margin: 5px 0 0 0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">#001-002-${Math.floor(Math.random() * 90000)}</h2>
                    </div>
                </div>
            </div>
        </div>

        <div style="padding: 40px;">
            <div style="display: flex; gap: 20px; margin-bottom: 40px;">
                <div style="flex: 1; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Detalles del Cliente</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a;">${cliente}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">ID Fiscal: Consumidor Final / RUC</p>
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Fecha de Emisión</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a;">${new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Hora: ${new Date().toLocaleTimeString()}</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                <thead>
                    <tr style="background: #0f172a; color: white;">
                        <th style="padding: 15px 20px; text-align: left; border-radius: 12px 0 0 12px; font-size: 11px; text-transform: uppercase;">Descripción del Producto</th>
                        <th style="padding: 15px; text-align: center; font-size: 11px; text-transform: uppercase;">Cant.</th>
                        <th style="padding: 15px; text-align: right; font-size: 11px; text-transform: uppercase;">P. Unit</th>
                        <th style="padding: 15px 20px; text-align: right; border-radius: 0 12px 12px 0; font-size: 11px; text-transform: uppercase;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 20px; font-weight: 600; color: #1e293b; font-size: 14px;">${item.nombre}</td>
                            <td style="padding: 20px; text-align: center; color: #64748b; font-weight: 500;">${item.qty}</td>
                            <td style="padding: 20px; text-align: right; color: #64748b;">$${parseFloat(item.precio_venta).toFixed(2)}</td>
                            <td style="padding: 20px; text-align: right; font-weight: 700; color: #0f172a; font-size: 15px;">$${(item.precio_venta * item.qty).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="width: 300px;">
                    <div style="border-left: 4px solid #3b82f6; padding-left: 15px; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                            Gracias por confiar en <b>ContaSistemas</b>. Esta ${tipo} tiene una validez de 15 días laborables.
                        </p>
                    </div>
                </div>
                <div style="width: 280px; background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; color: #64748b;">
                        <span>Subtotal Neto:</span> <span>$${sub.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 15px; color: #64748b; border-bottom: 1px dashed #cbd5e1; padding-bottom: 15px;">
                        <span>IVA (15%):</span> <span>$${iva.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 24px; font-weight: 900; color: #0f172a;">
                        <span>TOTAL:</span> <span style="color: #3b82f6;">$${tot.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div style="margin-top: 50px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 2px;">Documento generado electrónicamente por Súper POS - ContaSistemas</p>
            </div>
        </div>
    `;

    const opt = {
        margin: 0,
        filename: `${tipo.toUpperCase()}_FAC_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true,
            backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    return html2pdf().set(opt).from(facturaHtml).save();
}