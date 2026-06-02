const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://kalppatel1209_db_user:kalp5121@pharma.6loigjh.mongodb.net/mitram";

async function main() {
  await mongoose.connect(MONGODB_URI);
  const AppState = require('./models/AppState');
  const snapshot = await AppState.findOne({ key: 'main' }).lean();
  if (snapshot && snapshot.recentLogs) {
    console.log("--- RECENT LOGS ---");
    snapshot.recentLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.timestamp}] ${log.actionGu}`);
    });
  } else {
    console.log("No snapshot or no logs found.");
  }
  await mongoose.disconnect();
}

main().catch(console.error);
