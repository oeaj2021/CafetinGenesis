import { createCanvas } from '@napi-rs/canvas';

interface DebtImageData {
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

export const generateDebtStatementImage = async (
  debt: DebtImageData,
  currentExchangeRate: number,
  businessInfo = {
    name: 'CAFETÍN GÉNESIS',
    rif: 'J-50123456-7',
    phone: '+58 414-9998877',
    address: 'Av. Principal, Edificio Génesis, PB - Caracas'
  }
): Promise<Buffer> => {
  const width = 800;
  // Calculate dynamic height based on payments
  const paymentsCount = debt.payments?.length || 0;
  const height = Math.max(1050, 900 + paymentsCount * 35);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const isPaid = debt.status === 'PAID' || debt.remainingUSD <= 0;
  const currentRemainingBs = parseFloat((debt.remainingUSD * currentExchangeRate).toFixed(2));
  const totalAbonadoUSD = (debt.payments || []).reduce((acc, p) => acc + p.amountUSD, 0);

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Helper rounded rect
  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  // 1. TOP HEADER BANNER
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, 120);

  // Header bottom accent line
  ctx.fillStyle = isPaid ? '#10b981' : '#f59e0b';
  ctx.fillRect(0, 116, width, 4);

  // Company Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(businessInfo.name, 40, 50);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px sans-serif';
  ctx.fillText(`RIF: ${businessInfo.rif}   •   Telf: ${businessInfo.phone}`, 40, 78);
  ctx.fillText(businessInfo.address, 40, 98);

  // Document Badge
  const badgeX = 520;
  const badgeY = 28;
  const badgeW = 240;
  const badgeH = 64;
  drawRoundedRect(badgeX, badgeY, badgeW, badgeH, 10, isPaid ? '#10b981' : '#f59e0b');

  ctx.fillStyle = isPaid ? '#ffffff' : '#0f172a';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isPaid ? 'COMPROBANTE DE FINIQUITO' : 'ESTADO DE CUENTA', badgeX + badgeW / 2, badgeY + 28);
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(isPaid ? 'PAZ Y SALVO (SOLVENTE)' : 'NOTA DE COBRO / DEUDA', badgeX + badgeW / 2, badgeY + 48);
  ctx.textAlign = 'left';

  // 2. CLIENT INFO CARD
  let y = 145;
  drawRoundedRect(35, y, 730, 95, 12, '#ffffff', '#e2e8f0');

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('DATOS DEL CLIENTE', 55, y + 25);
  ctx.fillText('DETALLES DEL DOCUMENTO', 420, y + 25);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(debt.client?.name || 'Cliente Particular', 55, y + 50);

  ctx.fillStyle = '#475569';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Cédula/RIF: ${debt.client?.idNumber || 'N/A'}`, 55, y + 72);
  ctx.fillText(`Teléfono: ${debt.client?.phone || 'No registrado'}`, 210, y + 72);

  ctx.fillText(`Factura Ref: #${debt.invoice?.invoiceNumber || 'Venta a Crédito'}`, 420, y + 50);
  ctx.fillText(`Emisión: ${new Date(debt.createdAt).toLocaleDateString('es-VE')}`, 420, y + 72);

  // 3. FINANCIAL SUMMARY 4-CARDS
  y = 260;
  const cardW = 172;
  const gap = 14;

  // Card 1: Monto Original
  drawRoundedRect(35, y, cardW, 80, 10, '#ffffff', '#e2e8f0');
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('MONTO ORIGINAL', 48, y + 22);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`$${debt.totalUSD.toFixed(2)}`, 48, y + 48);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText(`Bs. ${debt.totalVES.toFixed(2)}`, 48, y + 68);

  // Card 2: Total Abonado
  drawRoundedRect(35 + (cardW + gap), y, cardW, 80, 10, '#ffffff', '#e2e8f0');
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('TOTAL ABONADO', 48 + (cardW + gap), y + 22);
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`$${totalAbonadoUSD.toFixed(2)}`, 48 + (cardW + gap), y + 48);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText(`${debt.payments?.length || 0} abonos hechos`, 48 + (cardW + gap), y + 68);

  // Card 3: Tasa BCV
  drawRoundedRect(35 + (cardW + gap) * 2, y, cardW, 80, 10, '#ffffff', '#e2e8f0');
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('TASA BCV DEL DÍA', 48 + (cardW + gap) * 2, y + 22);
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Bs. ${currentExchangeRate.toFixed(2)}`, 48 + (cardW + gap) * 2, y + 48);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText('Oficial actualizada', 48 + (cardW + gap) * 2, y + 68);

  // Card 4: Saldo Pendiente
  const statusBg = isPaid ? '#ecfdf5' : '#fff1f2';
  const statusBorder = isPaid ? '#a7f3d0' : '#fecdd3';
  const statusText = isPaid ? '#047857' : '#e11d48';

  drawRoundedRect(35 + (cardW + gap) * 3, y, cardW, 80, 10, statusBg, statusBorder);
  ctx.fillStyle = statusText;
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('SALDO PENDIENTE', 48 + (cardW + gap) * 3, y + 22);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`$${debt.remainingUSD.toFixed(2)}`, 48 + (cardW + gap) * 3, y + 48);
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`~ Bs. ${currentRemainingBs.toFixed(2)}`, 48 + (cardW + gap) * 3, y + 68);

  // 4. PAYMENTS TABLE
  y = 365;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('HISTORIAL DE ABONOS Y PAGOS RECIBIDOS', 35, y);

  y += 12;
  // Table Header
  drawRoundedRect(35, y, 730, 32, 6, '#0f172a');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('FECHA', 50, y + 20);
  ctx.fillText('MÉTODO DE PAGO', 160, y + 20);
  ctx.fillText('REFERENCIA / NOTA', 310, y + 20);
  ctx.textAlign = 'right';
  ctx.fillText('MONTO ($)', 620, y + 20);
  ctx.fillText('MONTO (BS)', 745, y + 20);
  ctx.textAlign = 'left';

  y += 32;

  const payments = debt.payments || [];
  if (payments.length === 0) {
    drawRoundedRect(35, y, 730, 36, 0, '#ffffff', '#e2e8f0');
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 12px sans-serif';
    ctx.fillText('No se han registrado abonos todavía.', 50, y + 22);
    y += 36;
  } else {
    payments.forEach((p, idx) => {
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      drawRoundedRect(35, y, 730, 32, 0, rowBg, '#f1f5f9');

      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.fillText(new Date(p.createdAt).toLocaleDateString('es-VE'), 50, y + 20);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(p.paymentMethod, 160, y + 20);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#64748b';
      const refText = p.reference ? `Ref: ${p.reference}` : (p.note || 'Sin nota');
      ctx.fillText(refText.length > 30 ? refText.slice(0, 30) + '...' : refText, 310, y + 20);

      ctx.textAlign = 'right';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#059669';
      ctx.fillText(`$${p.amountUSD.toFixed(2)}`, 620, y + 20);

      ctx.fillStyle = '#475569';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Bs. ${p.amountVES.toFixed(2)}`, 745, y + 20);
      ctx.textAlign = 'left';

      y += 32;
    });
  }

  // 5. STATUS BOX / INSTRUCTIONS
  y += 20;
  if (isPaid) {
    drawRoundedRect(35, y, 730, 110, 12, '#ecfdf5', '#10b981');
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓ CONSTANCIA DE SOLVENCIA Y FINIQUITO TOTAL', width / 2, y + 38);

    ctx.fillStyle = '#065f46';
    ctx.font = '13px sans-serif';
    ctx.fillText(
      `Cafetín Génesis certifica que el cliente ${debt.client?.name || 'mencionado'} ha cancelado satisfactoriamente`,
      width / 2,
      y + 65
    );
    ctx.fillText(
      `la totalidad del saldo adeudado, quedando en estado SOLVENTE (Saldo $0.00).`,
      width / 2,
      y + 85
    );
    ctx.textAlign = 'left';
    y += 125;
  } else {
    drawRoundedRect(35, y, 730, 125, 12, '#fffbeb', '#fde68a');
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('OPCIONES Y DATOS PARA REALIZAR EL PAGO', 55, y + 28);

    ctx.fillStyle = '#78350f';
    ctx.font = '12px sans-serif';
    ctx.fillText('• Pago Móvil: Banco Banesco (0134) | RIF: J-50123456-7 | Teléfono: 0414-9998877', 55, y + 52);
    ctx.fillText('• Transferencia: Banesco Cuenta Corriente N° 0134-0000-00-0000000000', 55, y + 72);
    ctx.fillText('• Divisas en Efectivo / Zelle: Directamente en caja o contactar administración.', 55, y + 92);
    ctx.fillText('• Comprobantes: Envíe su captura vía WhatsApp al +58 414-9998877 para asentar su abono.', 55, y + 112);
    y += 140;
  }

  // 6. FOOTER
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Documento digital generado automáticamente por Cafetín Génesis POS • ${new Date().toLocaleDateString('es-VE')} ${new Date().toLocaleTimeString('es-VE')}`,
    width / 2,
    height - 25
  );

  return canvas.toBuffer('image/png');
};
