const PDFDocument = require('pdfkit');

/**
 * Generate a PDF report with Gujarati content
 * Uses system fonts since Noto Sans Gujarati may not be available
 * Falls back to basic PDF with transliterated headers
 */
async function generatePDF(type, data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: type === 'member-distribution' ? 'landscape' : 'portrait',
        margins: { top: 50, bottom: 50, left: 40, right: 40 }
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(20)
        .text('MitraM - Financial Report', { align: 'center' })
        .moveDown(0.5);

      doc.fontSize(12)
        .fillColor('#666')
        .text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' })
        .moveDown(1);

      doc.fillColor('#000');

      if (type === 'master-summary' && data) {
        drawMasterSummaryTable(doc, data);
      } else if (type === 'member-distribution' && data) {
        drawMemberDistributionTable(doc, data);
      } else if (type === 'complete' && data) {
        drawMasterSummaryTable(doc, data.masterSummary);
        doc.addPage({ layout: 'landscape' });
        drawMemberDistributionTable(doc, data);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawMasterSummaryTable(doc, report) {
  if (!report || !report.masterSummary) return;

  doc.fontSize(16)
    .text('Master Summary / Mukhya Hisab', { align: 'center' })
    .moveDown(1);

  const years = report.years || ['2023/24', '2024/25'];
  const tableTop = doc.y;
  const colWidths = [40, 120, ...years.map(() => 100), 100];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const startX = (doc.page.width - tableWidth) / 2;

  // Header row
  doc.fontSize(10).font('Helvetica-Bold');
  let x = startX;
  const headers = ['No.', 'Details / Vigat', ...years.map(y => `Year ${y}`), 'Total / Kul'];
  
  // Draw header background
  doc.rect(startX, tableTop, tableWidth, 25).fill('#FF9933');
  doc.fillColor('#FFF');
  
  headers.forEach((header, i) => {
    doc.text(header, x + 5, tableTop + 7, { width: colWidths[i] - 10, align: 'center' });
    x += colWidths[i];
  });

  // Data rows
  doc.font('Helvetica').fillColor('#000');
  let y = tableTop + 25;

  const rowLabels = {
    'aavak': 'Aavak (Income)',
    'bakiKharcha': 'Baki Kharcha (Expense)',
    'vadheliRakam': 'Vadheli Rakam (Remaining)',
    'nafoo': 'Nafoo (Profit)',
    'holding': 'Holding',
    'gopiMandal': 'Gopi Mandal',
    'ekandKul': 'Ekand Kul (Grand Total)'
  };

  report.masterSummary.forEach((row, index) => {
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }

    const bgColor = index % 2 === 0 ? '#FFF8E7' : '#FFFFFF';
    doc.rect(startX, y, tableWidth, 22).fill(bgColor);
    doc.fillColor('#000');

    x = startX;
    const values = [
      (index + 1).toString(),
      rowLabels[row.key] || row.labelGujarati || row.key,
      ...years.map(yr => formatINR(row.values?.get?.(yr) || row.values?.[yr] || 0)),
      formatINR(row.total || 0)
    ];

    values.forEach((val, i) => {
      doc.text(val, x + 5, y + 6, { width: colWidths[i] - 10, align: i === 1 ? 'left' : 'right' });
      x += colWidths[i];
    });

    // Draw cell borders
    x = startX;
    colWidths.forEach(w => {
      doc.rect(x, y, w, 22).stroke('#DDD');
      x += w;
    });

    y += 22;
  });
}

function drawMemberDistributionTable(doc, data) {
  if (!data || !data.members) return;

  doc.fontSize(16)
    .text('Member Distribution / Sabhya Vitaran', { align: 'center' })
    .moveDown(1);

  const years = data.years || ['2023/24', '2024/25'];
  const tableTop = doc.y;
  
  // Simplified columns for PDF readability
  const headers = ['Member', ...years.map(y => `Mudi ${y}`), 'Total Mudi', 
    ...years.map(y => `Kharcha ${y}`), 'Vadheli', 
    ...years.map(y => `Nafoo ${y}`), 'Holding', 'Gopi M.', 'Ekand Kul'];
  
  const colCount = headers.length;
  const colWidth = (doc.page.width - 80) / colCount;
  const startX = 40;

  // Header
  doc.fontSize(7).font('Helvetica-Bold');
  doc.rect(startX, tableTop, colWidth * colCount, 20).fill('#FF9933');
  doc.fillColor('#FFF');
  
  headers.forEach((h, i) => {
    doc.text(h, startX + i * colWidth + 2, tableTop + 5, { width: colWidth - 4, align: 'center' });
  });

  // Data
  doc.font('Helvetica').fillColor('#000').fontSize(7);
  let y = tableTop + 20;

  data.members.forEach((member, idx) => {
    const bgColor = idx % 2 === 0 ? '#FFF8E7' : '#FFFFFF';
    doc.rect(startX, y, colWidth * colCount, 18).fill(bgColor);
    doc.fillColor('#000');

    const row = [member.name];
    years.forEach(yr => {
      const yd = member.yearlyData?.find(d => d.year === yr);
      row.push(formatINR(yd?.mudi || 0));
    });
    row.push(formatINR(member.totalMudi || 0));
    years.forEach(yr => {
      const yd = member.yearlyData?.find(d => d.year === yr);
      row.push(formatINR(yd?.kharcha || 0));
    });
    row.push(formatINR(member.totalVadheliRakam || 0));
    years.forEach(yr => {
      const yd = member.yearlyData?.find(d => d.year === yr);
      row.push(formatINR(yd?.nafoo || 0));
    });
    // Last year holding
    const lastYearData = member.yearlyData?.find(d => d.year === years[years.length - 1]);
    row.push(formatINR(lastYearData?.holding || 0));
    row.push(formatINR(lastYearData?.gopiMandal || 0));
    row.push(formatINR(member.totalEkandKul || 0));

    row.forEach((val, i) => {
      doc.text(val, startX + i * colWidth + 2, y + 5, { width: colWidth - 4, align: i === 0 ? 'left' : 'right' });
    });

    y += 18;
  });
}

function formatINR(num) {
  if (num === 0) return '0';
  return num.toLocaleString('en-IN');
}

module.exports = { generatePDF };
