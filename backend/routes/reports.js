const express = require('express');
const YearlyReport = require('../models/YearlyReport');
const Member = require('../models/Member');
const authMiddleware = require('../middleware/auth');
const { generatePDF } = require('../services/pdfGenerator');

const router = express.Router();

// GET /api/reports/master-summary - get master summary table data
router.get('/master-summary', authMiddleware, async (req, res) => {
  try {
    let report = await YearlyReport.findOne({ reportType: 'master_summary' });
    
    if (!report) {
      // Create default master summary
      report = new YearlyReport({
        reportType: 'master_summary',
        years: ['2023/24', '2024/25'],
        masterSummary: [
          { key: 'aavak', labelGujarati: 'આવક', values: new Map([['2023/24', 0], ['2024/25', 0]]), total: 0 },
          { key: 'bakiKharcha', labelGujarati: 'બાકી ખર્ચ', values: new Map([['2023/24', 0], ['2024/25', 0]]), total: 0 },
          { key: 'vadheliRakam', labelGujarati: 'વધેલ રકમ', values: new Map([['2023/24', 0], ['2024/25', 0]]), total: 0 },
          { key: 'nafoo', labelGujarati: 'નફો', values: new Map([['2023/24', 0], ['2024/25', 0]]), total: 0 },
          { key: 'holding', labelGujarati: 'હોલ્ડિંગ', values: new Map([['2023/24', 0], ['2024/25', 0]]), total: 0 },
          { key: 'gopiMandal', labelGujarati: 'ગોપી મંડળ', values: new Map([['2023/24', 0], ['2024/25', 0]]), total: 0 },
          { key: 'ekandKul', labelGujarati: 'એકંદર કુલ', values: new Map([['2023/24', 0], ['2024/25', 0]]), total: 0 },
        ]
      });
      await report.save();
    }

    res.json(report);
  } catch (error) {
    console.error('Get master summary error:', error);
    res.status(500).json({ message: 'મુખ્ય સારાંશ મેળવવામાં ભૂલ' });
  }
});

// PUT /api/reports/master-summary - update master summary
router.put('/master-summary', authMiddleware, async (req, res) => {
  try {
    const { masterSummary, years } = req.body;
    
    let report = await YearlyReport.findOne({ reportType: 'master_summary' });
    if (!report) {
      report = new YearlyReport({ reportType: 'master_summary' });
    }

    if (years) report.years = years;
    if (masterSummary) {
      report.masterSummary = masterSummary.map(row => ({
        ...row,
        values: row.values instanceof Map ? row.values : new Map(Object.entries(row.values || {})),
        total: Object.values(row.values || {}).reduce((sum, v) => sum + (Number(v) || 0), 0)
      }));
    }
    report.lastUpdatedBy = req.user?.username || 'user';

    await report.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('report-updated', { type: 'master_summary', report });
      io.emit('data-updated', { type: 'report' });
    }

    res.json({ message: 'મુખ્ય સારાંશ અપડેટ થયો', report });
  } catch (error) {
    console.error('Update master summary error:', error);
    res.status(500).json({ message: 'મુખ્ય સારાંશ અપડેટ કરવામાં ભૂલ' });
  }
});

// GET /api/reports/member-distribution - get member distribution table data
router.get('/member-distribution', authMiddleware, async (req, res) => {
  try {
    const members = await Member.find().sort({ name: 1 });
    res.json({
      years: ['2023/24', '2024/25'],
      members: members
    });
  } catch (error) {
    console.error('Get member distribution error:', error);
    res.status(500).json({ message: 'સભ્ય વિતરણ મેળવવામાં ભૂલ' });
  }
});

// GET /api/reports/pdf/:type - generate PDF report
router.get('/pdf/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    let data;

    if (type === 'master-summary') {
      data = await YearlyReport.findOne({ reportType: 'master_summary' });
    } else if (type === 'member-distribution') {
      const members = await Member.find().sort({ name: 1 });
      data = { years: ['2023/24', '2024/25'], members };
    } else if (type === 'complete') {
      const masterSummary = await YearlyReport.findOne({ reportType: 'master_summary' });
      const members = await Member.find().sort({ name: 1 });
      data = { masterSummary, members, years: ['2023/24', '2024/25'] };
    } else {
      return res.status(400).json({ message: 'અમાન્ય રિપોર્ટ પ્રકાર' });
    }

    const pdfBuffer = await generatePDF(type, data);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=mitram-report-${type}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'PDF બનાવવામાં ભૂલ' });
  }
});

// GET /api/reports/years - get available years
router.get('/years', authMiddleware, async (req, res) => {
  try {
    const report = await YearlyReport.findOne({ reportType: 'master_summary' });
    const years = report ? report.years : ['2023/24', '2024/25'];
    res.json(years);
  } catch (error) {
    res.status(500).json({ message: 'વર્ષોની યાદી મેળવવામાં ભૂલ' });
  }
});

// POST /api/reports/years - add a new year
router.post('/years', authMiddleware, async (req, res) => {
  try {
    const { year } = req.body;
    if (!year) {
      return res.status(400).json({ message: 'વર્ષ જરૂરી છે' });
    }

    let report = await YearlyReport.findOne({ reportType: 'master_summary' });
    if (!report) {
      return res.status(404).json({ message: 'રિપોર્ટ મળ્યો નથી' });
    }

    if (!report.years.includes(year)) {
      report.years.push(year);
      // Add new year column to each summary row
      report.masterSummary.forEach(row => {
        row.values.set(year, 0);
      });
      await report.save();
    }

    // Add new year to all members
    const members = await Member.find();
    for (const member of members) {
      const exists = member.yearlyData.find(yd => yd.year === year);
      if (!exists) {
        member.yearlyData.push({
          year,
          mudi: 0, kharcha: 0, vadheliRakam: 0,
          nafoo: 0, holding: 0, gopiMandal: 0, ekandKul: 0
        });
        await member.save();
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('data-updated', { type: 'year-added', year });
    }

    res.json({ message: `વર્ષ ${year} ઉમેરાયું`, years: report.years });
  } catch (error) {
    console.error('Add year error:', error);
    res.status(500).json({ message: 'વર્ષ ઉમેરવામાં ભૂલ' });
  }
});

module.exports = router;
