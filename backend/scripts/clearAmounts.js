require('dotenv').config();
const connectDB = require('../config/db');
const AppState = require('../models/AppState');
const YearlyReport = require('../models/YearlyReport');
const Member = require('../models/Member');

async function clear() {
  const conn = await connectDB();
  if (!conn) {
    console.error('DB not connected; aborting');
    process.exit(1);
  }

  try {
    // Clean AppState: keep members but strip financial fields and other data
    const app = await AppState.findOne({ key: 'main' });
    if (app) {
      const minimalMembers = (app.members || []).map((m) => ({
        id: m.id || m._id || m._id?.toString?.() || m.id,
        nameEn: m.nameEn || m.name || '',
        nameGu: m.nameGu || m.nameGujarati || '',
        status: m.status || 'ACTIVE',
        imageUrl: m.imageUrl || m.photo || ''
      }));

      app.members = minimalMembers;
      app.masterRows = [];
      app.currentYear = '';
      app.appTitleGu = '';
      app.appDescriptionGu = '';
      app.recentLogs = [];
      app.targetAccounts = [];
      await app.save();
      console.log('✔️  AppState updated (kept minimal members)');
    } else {
      console.log('ℹ️  No AppState found with key=main');
    }

    // Clear YearlyReport master_summary values
    const report = await YearlyReport.findOne({ reportType: 'master_summary' });
    if (report) {
      report.masterSummary = (report.masterSummary || []).map((r) => ({
        key: r.key,
        labelGujarati: r.labelGujarati || r.labelEnglish || '',
        values: new Map([['2023', 0], ['2024', 0]]),
        total: 0
      }));
      await report.save();
      console.log('✔️  YearlyReport.masterSummary values cleared');
    } else {
      console.log('ℹ️  No YearlyReport (master_summary) found');
    }

    // Update Member collection: zero out financials and notes, keep imageUrl and names
    const members = await Member.find();
    if (members && members.length) {
      for (const m of members) {
        const yearsMap = {};
        ['year2023', 'year2024', 'year2025', 'year2026', 'year2027', 'year2028', 'year2029', 'year2030', 'year2031', 'year2032', 'year2033', 'year2034', 'year2035'].forEach((k) => {
          yearsMap[k] = { capital: 0, expense: 0, profit: 0, remainingAmount: 0 };
        });

        m.years = yearsMap;
        m.notes = '';
        m.gopiMandal = 0;
        await m.save();
      }
      console.log(`✔️  Cleared financial fields for ${members.length} Member(s)`);
    } else {
      console.log('ℹ️  No Member documents found');
    }

    console.log('\n✅ Done clearing amounts and related fields.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error while clearing:', err);
    process.exit(1);
  }
}

clear();
