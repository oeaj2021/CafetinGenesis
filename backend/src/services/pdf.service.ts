import PDFDocument from 'pdfkit';

interface DebtPDFData {
  id: string;
  totalUSD: number;
  totalVES: number;
  remainingUSD: number;
  remainingVES: number;
  status: string;
  createdAt: Date | string;
  client?: {
    name: string;
    idNumber: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
  invoice?: {
    invoiceNumber: string;
    createdAt: Date | string;
  } | null;
  payments?: Array<{
    id: string;
    amountUSD: number;
    amountVES: number;
    exchangeRate: number;
    paymentMethod: string;
    reference?: string | null;
    note?: string | null;
    createdAt: Date | string;
  }>;
}

export const generateDebtStatementPDF = (
  debt: DebtPDFData,
  currentExchangeRate: number,
  businessInfo = {
    name: 'CAFETÍN GÉNESIS',
    rif: 'J-50123456-7',
    phone: '+58 414-9998877',
    address: 'Av. Principal, Edificio Génesis, PB - Caracas, Venezuela',
    email: 'contacto@cafetingenesis.com'
  }
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    const isPaid = debt.status === 'PAID' || debt.remainingUSD <= 0;
    const currentRemainingBs = parseFloat((debt.remainingUSD * currentExchangeRate).toFixed(2));
    const totalAbonadoUSD = (debt.payments || []).reduce((acc, p) => acc + p.amountUSD, 0);

    // ==========================================
    // 1. TOP HEADER BANNER
    // ==========================================
    const primaryColor = '#0f172a'; // slate-900
    const accentColor = '#f59e0b';  // amber-500
    const successColor = '#10b981'; // emerald-500
    const dangerColor = '#e11d48';  // rose-600

    // Header Background Bar
    doc.rect(40, 40, 532, 65).fill(primaryColor);

    // Company Title & Info
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text(businessInfo.name, 55, 52);
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
      .text(`RIF: ${businessInfo.rif}  |  Telf: ${businessInfo.phone}`, 55, 74)
      .text(businessInfo.address, 55, 85);

    // Document Type Pill / Stamp
    const docTypeTitle = isPaid ? 'COMPROBANTE DE FINIQUITO' : 'ESTADO DE CUENTA';
    const docTypeSub = isPaid ? 'PAZ Y SALVO (SOLVENTE)' : 'NOTA DE COBRO / DEUDA';
    const badgeBg = isPaid ? successColor : accentColor;

    doc.roundedRect(380, 50, 180, 45, 6).fill(badgeBg);
    doc.fillColor(isPaid ? '#ffffff' : '#0f172a').fontSize(10).font('Helvetica-Bold')
      .text(docTypeTitle, 385, 58, { width: 170, align: 'center' });
    doc.fontSize(8).font('Helvetica')
      .text(docTypeSub, 385, 73, { width: 170, align: 'center' });

    // ==========================================
    // 2. CLIENT & INVOICE METADATA BOX
    // ==========================================
    let y = 120;
    doc.roundedRect(40, y, 532, 70, 8).lineWidth(1).strokeColor('#e2e8f0').fillAndStroke('#f8fafc', '#e2e8f0');

    // Left Column: Client Details
    doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('DATOS DEL CLIENTE:', 55, y + 10);
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(debt.client?.name || 'Cliente Particular', 55, y + 22);
    doc.fillColor('#475569').fontSize(9).font('Helvetica')
      .text(`Cédula / RIF: ${debt.client?.idNumber || 'N/A'}`, 55, y + 37)
      .text(`Teléfono: ${debt.client?.phone || 'No registrado'}`, 55, y + 50);

    // Right Column: Debt & Invoice Details
    doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('DETALLES DEL REGISTRO:', 340, y + 10);
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica')
      .text(`Ref. Origen: Factura #${debt.invoice?.invoiceNumber || 'Venta a Crédito'}`, 340, y + 23)
      .text(`Fecha Emisión: ${new Date(debt.createdAt).toLocaleDateString('es-VE')}`, 340, y + 36)
      .text(`Fecha Reporte: ${new Date().toLocaleDateString('es-VE')} ${new Date().toLocaleTimeString('es-VE')}`, 340, y + 49);

    // ==========================================
    // 3. FINANCIAL SUMMARY HERO CARDS
    // ==========================================
    y = 205;
    const cardWidth = 125;
    const gap = 10;

    // Card 1: Monto Original
    doc.roundedRect(40, y, cardWidth, 55, 6).fillAndStroke('#ffffff', '#e2e8f0');
    doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('MONTO ORIGINAL', 48, y + 8);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text(`$${debt.totalUSD.toFixed(2)}`, 48, y + 22);
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica').text(`Bs. ${debt.totalVES.toFixed(2)}`, 48, y + 40);

    // Card 2: Total Abonado
    doc.roundedRect(40 + cardWidth + gap, y, cardWidth, 55, 6).fillAndStroke('#ffffff', '#e2e8f0');
    doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('TOTAL ABONADO', 48 + cardWidth + gap, y + 8);
    doc.fillColor('#059669').fontSize(13).font('Helvetica-Bold').text(`$${totalAbonadoUSD.toFixed(2)}`, 48 + cardWidth + gap, y + 22);
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica').text(`${debt.payments?.length || 0} pago(s) realizados`, 48 + cardWidth + gap, y + 40);

    // Card 3: Tasa BCV Actual
    doc.roundedRect(40 + (cardWidth + gap) * 2, y, cardWidth, 55, 6).fillAndStroke('#ffffff', '#e2e8f0');
    doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('TASA BCV DEL DÍA', 48 + (cardWidth + gap) * 2, y + 8);
    doc.fillColor('#2563eb').fontSize(13).font('Helvetica-Bold').text(`Bs. ${currentExchangeRate.toFixed(2)}`, 48 + (cardWidth + gap) * 2, y + 22);
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica').text('Sincronizada oficial', 48 + (cardWidth + gap) * 2, y + 40);

    // Card 4: Saldo Pendiente Actual
    const statusBg = isPaid ? '#ecfdf5' : '#fff1f2';
    const statusBorder = isPaid ? '#a7f3d0' : '#fecdd3';
    const statusTextColor = isPaid ? '#047857' : dangerColor;

    doc.roundedRect(40 + (cardWidth + gap) * 3, y, cardWidth, 55, 6).fillAndStroke(statusBg, statusBorder);
    doc.fillColor(statusTextColor).fontSize(7).font('Helvetica-Bold').text('SALDO PENDIENTE', 48 + (cardWidth + gap) * 3, y + 8);
    doc.fillColor(statusTextColor).fontSize(14).font('Helvetica-Bold').text(`$${debt.remainingUSD.toFixed(2)}`, 48 + (cardWidth + gap) * 3, y + 22);
    doc.fillColor(statusTextColor).fontSize(8).font('Helvetica-Bold').text(`~ Bs. ${currentRemainingBs.toFixed(2)}`, 48 + (cardWidth + gap) * 3, y + 40);

    // ==========================================
    // 4. PAYMENTS / ABONOS TABLE
    // ==========================================
    y = 280;
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('HISTORIAL DE ABONOS Y PAGOS RECIBIDOS', 40, y);

    y += 18;
    // Table Header
    doc.rect(40, y, 532, 20).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('FECHA', 50, y + 6);
    doc.text('MÉTODO DE PAGO', 140, y + 6);
    doc.text('REFERENCIA / NOTA', 260, y + 6);
    doc.text('MONTO ($)', 430, y + 6, { width: 60, align: 'right' });
    doc.text('MONTO (BS)', 500, y + 6, { width: 60, align: 'right' });

    y += 20;

    const payments = debt.payments || [];
    if (payments.length === 0) {
      doc.rect(40, y, 532, 25).fillAndStroke('#ffffff', '#f1f5f9');
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Oblique').text('No se han registrado abonos todavía.', 50, y + 8);
      y += 25;
    } else {
      payments.forEach((p, idx) => {
        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, y, 532, 22).fillAndStroke(rowBg, '#f1f5f9');

        doc.fillColor('#334155').fontSize(8).font('Helvetica');
        doc.text(new Date(p.createdAt).toLocaleDateString('es-VE'), 50, y + 6);
        doc.font('Helvetica-Bold').text(p.paymentMethod, 140, y + 6);
        doc.font('Helvetica').text(p.reference ? `Ref: ${p.reference}` : (p.note || 'Sin nota'), 260, y + 6, { width: 160, ellipsis: true });
        doc.font('Helvetica-Bold').fillColor('#059669').text(`$${p.amountUSD.toFixed(2)}`, 430, y + 6, { width: 60, align: 'right' });
        doc.fillColor('#64748b').text(`Bs. ${p.amountVES.toFixed(2)}`, 500, y + 6, { width: 60, align: 'right' });

        y += 22;
      });
    }

    // ==========================================
    // 5. STATUS STATEMENT / PAYMENT INSTRUCTIONS
    // ==========================================
    y += 20;

    if (isPaid) {
      // Finiquito Seal Box
      doc.roundedRect(40, y, 532, 85, 8).lineWidth(1.5).strokeColor(successColor).fillAndStroke('#ecfdf5', successColor);

      doc.fillColor(successColor).fontSize(14).font('Helvetica-Bold')
        .text('✓ CONSTANCIA DE SOLVENCIA Y FINIQUITO TOTAL', 55, y + 15, { width: 500, align: 'center' });

      doc.fillColor('#065f46').fontSize(9).font('Helvetica')
        .text(
          `Por medio del presente documento, ${businessInfo.name} hace constar que el cliente ${debt.client?.name || 'mencionado'} ha cancelado satisfactoriamente la totalidad del saldo adeudado, quedando en estado SOLVENTE (Saldo $0.00) respecto a la Factura #${debt.invoice?.invoiceNumber || 'Venta a Crédito'}.`,
          55,
          y + 35,
          { width: 500, align: 'center', lineGap: 3 }
        );
      y += 100;
    } else {
      // Payment Instructions Box
      doc.roundedRect(40, y, 532, 100, 8).lineWidth(1).strokeColor('#e2e8f0').fillAndStroke('#fffbeb', '#fde68a');

      doc.fillColor('#92400e').fontSize(10).font('Helvetica-Bold')
        .text('OPCIONES Y DATOS PARA REALIZAR EL PAGO', 55, y + 12);

      doc.fillColor('#78350f').fontSize(8.5).font('Helvetica')
        .text('• Pago Móvil: Banco Banesco (0134) | RIF: J-50123456-7 | Teléfono: 0414-9998877', 55, y + 30)
        .text('• Transferencia Bancaria: Banco Banesco Cta Corriente N° 0134-0000-00-0000000000', 55, y + 44)
        .text('• Divisas en Efectivo / Zelle: En caja del cafetín o consultar con administración.', 55, y + 58)
        .text('• Notificación: Envíe su comprobante vía WhatsApp al +58 414-9998877 para validar y asentar su abono.', 55, y + 72);

      y += 115;
    }

    // ==========================================
    // 6. SIGNATURE & LEGAL FOOTER
    // ==========================================
    // Signatures
    const sigY = 660;
    doc.moveTo(70, sigY).lineTo(230, sigY).lineWidth(1).strokeColor('#94a3b8');
    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Firma y Sello Cafetín', 70, sigY + 5, { width: 160, align: 'center' });

    doc.moveTo(350, sigY).lineTo(510, sigY).lineWidth(1).strokeColor('#94a3b8');
    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Conforme Cliente', 350, sigY + 5, { width: 160, align: 'center' });

    // Bottom Notice
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
      .text(
        'Este comprobante digital ha sido emitido por el Sistema de Facturación y Control Cafetín Génesis. Válido como soporte contable interno.',
        40,
        730,
        { width: 532, align: 'center' }
      );

    doc.end();
  });
};
