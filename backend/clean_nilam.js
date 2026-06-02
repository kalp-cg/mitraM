const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://kalppatel1209_db_user:kalp5121@pharma.6loigjh.mongodb.net/mitram";
const TARGET_KUL_JAMA = 1713685;
const NILAM_NAMES = ['Nilam Prajapati', 'NILAM PRAJAPATI'];

function hasNilamReference(value) {
  if (typeof value !== 'string') return false;
  return NILAM_NAMES.some(name => value.includes(name));
}

function cleanNotes(notes = '') {
  return notes
    .split(',')
    .map(note => note.trim())
    .filter(note => !hasNilamReference(note) && !note.includes('NILAM') && !note.includes('Nilam'))
    .join(', ');
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");
  
  const AppState = require('./models/AppState');
  const Member = require('./models/Member');
  const YearlyReport = require('./models/YearlyReport');
  
  const snapshot = await AppState.findOne({ key: 'main' });
  if (!snapshot) {
    console.log("No AppState snapshot found!");
    await mongoose.disconnect();
    return;
  }
  
  console.log("Cleaning AppState snapshot...");
  
  // 1. Clean Target Accounts
  if (snapshot.targetAccounts) {
    snapshot.targetAccounts = snapshot.targetAccounts.filter(acc => 
      !hasNilamReference(acc)
    );
  }
  
  // 2. Clean Recent Logs
  if (snapshot.recentLogs) {
    snapshot.recentLogs = snapshot.recentLogs.filter(log => {
      const haystack = Object.values(log || {})
        .map(value => (value == null ? '' : String(value)))
        .join(' ');
      return !hasNilamReference(haystack) &&
        !haystack.includes('MAY-2026') &&
        !haystack.includes('APRIL-2026') &&
        !haystack.includes('MARCH-2026') &&
        !haystack.includes('T-SHIRT');
    });
  }
  
  // 3. Clean Members in AppState Snapshot
  if (snapshot.members) {
    snapshot.members = snapshot.members.map(m => {
      const updated = { ...m };
      
      // Clean notes to remove references to NILAM PRAJAPATI
      if (updated.notes) {
        updated.notes = cleanNotes(updated.notes);
      }
      
      return updated;
    });
  }

  // Keep the persisted grand total aligned with the requested value.
  if (snapshot.masterRows) {
    snapshot.masterRows = snapshot.masterRows.map(row => {
      const updatedRow = { ...row };
      if (updatedRow.id === 'mr7' && Object.prototype.hasOwnProperty.call(updatedRow, 'year26')) {
        updatedRow.year26 = TARGET_KUL_JAMA;
      }
      return updatedRow;
    });
  }
  
  // Save updated snapshot
  snapshot.markModified('members');
  snapshot.markModified('targetAccounts');
  snapshot.markModified('recentLogs');
  snapshot.markModified('masterRows');
  await snapshot.save();
  console.log("AppState snapshot successfully updated and saved.");
  
  // 4. Update individual Member documents in MongoDB collection to sync
  const dbMembers = await Member.find({});
  console.log(`Syncing ${dbMembers.length} individual Member documents in DB...`);
  
  for (const m of dbMembers) {
    // Clean notes
    if (m.notes) {
      m.notes = cleanNotes(m.notes);
    }
    
    m.markModified('notes');
    await m.save();
  }
  console.log("All individual Member documents successfully updated.");
  
  // 5. Update Yearly Reports Master Summary for Year 2026
  const report = await YearlyReport.findOne({ reportType: 'master_summary' });
  if (report && report.masterSummary) {
    console.log("Updating YearlyReport master summary values for year 2026...");
    const ekandKulRow = report.masterSummary.find(row => row.key === 'ekandKul');
    if (ekandKulRow) {
      if (ekandKulRow.values && typeof ekandKulRow.values.set === 'function') {
        ekandKulRow.values.set('2026', TARGET_KUL_JAMA);
      } else {
        ekandKulRow.values = { ...(ekandKulRow.values || {}), 2026: TARGET_KUL_JAMA };
      }
      ekandKulRow.total = TARGET_KUL_JAMA;
    }
    report.markModified('masterSummary');
    await report.save();
    console.log("YearlyReport master summary successfully reset.");
  }
  
  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(console.error);
