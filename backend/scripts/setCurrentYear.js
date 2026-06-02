require('dotenv').config();
const connectDB = require('../config/db');
const AppState = require('../models/AppState');
const YearlyReport = require('../models/YearlyReport');

async function setYear() {
  const conn = await connectDB();
  if (!conn) {
    console.error('DB not connected; aborting');
    process.exit(1);
  }

  try {
    const yearKey = 'year2026';
    const yearLabel = '2026';

    const app = await AppState.findOne({ key: 'main' });
    if (app) {
      app.currentYear = yearKey;
      await app.save();
      console.log(`✔️  AppState.currentYear set to ${yearKey}`);
    } else {
      await AppState.create({ key: 'main', currentYear: yearKey });
      console.log(`ℹ️  Created AppState with currentYear ${yearKey}`);
    }

    const report = await YearlyReport.findOne({ reportType: 'master_summary' });
    if (report) {
      // ensure values map contains 2026 for each row
      report.masterSummary = (report.masterSummary || []).map((r) => {
        const newValues = new Map();
        const existing = r.values || new Map();
        const v2023 = existing.get ? Number(existing.get('2023') || 0) : Number(existing['2023'] || 0);
        const v2024 = existing.get ? Number(existing.get('2024') || 0) : Number(existing['2024'] || 0);
        newValues.set('2023', v2023);
        newValues.set('2024', v2024);
        newValues.set(yearLabel, 0);
        return { key: r.key, labelGujarati: r.labelGujarati || r.labelEnglish || '', values: newValues, total: Number(v2023) + Number(v2024) };
      });
      // ensure years array includes 2026
      report.years = Array.from(new Set([...(report.years || []), yearLabel]));
      await report.save();
      console.log('✔️  YearlyReport updated to include 2026');
    } else {
      // create a minimal master_summary with 2026 included
      const rows = [
        { key: 'aavak', labelGujarati: 'આવક', values: new Map([['2023', 0], ['2024', 0], [yearLabel, 0]]), total: 0 },
        { key: 'bakiKharcha', labelGujarati: 'બાકી ખર્ચ', values: new Map([['2023', 0], ['2024', 0], [yearLabel, 0]]), total: 0 },
        { key: 'vadheliRakam', labelGujarati: 'વધેલ રકમ', values: new Map([['2023', 0], ['2024', 0], [yearLabel, 0]]), total: 0 },
        { key: 'nafoo', labelGujarati: 'નફો', values: new Map([['2023', 0], ['2024', 0], [yearLabel, 0]]), total: 0 },
        { key: 'holding', labelGujarati: 'હોલ્ડિંગ', values: new Map([['2023', 0], ['2024', 0], [yearLabel, 0]]), total: 0 },
        { key: 'gopiMandal', labelGujarati: 'ગોપી મંડળ', values: new Map([['2023', 0], ['2024', 0], [yearLabel, 0]]), total: 0 },
        { key: 'ekandKul', labelGujarati: 'એકંદર કુલ', values: new Map([['2023', 0], ['2024', 0], [yearLabel, 0]]), total: 0 }
      ];
      await YearlyReport.create({ reportType: 'master_summary', years: ['2023', '2024', yearLabel], masterSummary: rows });
      console.log('ℹ️  Created YearlyReport(master_summary) including 2026');
    }

    console.log('\n✅ Current year set to 2026 in DB.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

setYear();
