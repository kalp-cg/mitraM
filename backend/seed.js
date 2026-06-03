/**
 * Database Seed Script
 * Sets up initial user and member data
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Member = require('./models/Member');
const YearlyReport = require('./models/YearlyReport');
const AppState = require('./models/AppState');

const MEMBERS = [
  {
    nameEn: 'V G RAJPUT',
    nameGu: 'વી. જી. રાજપૂત',
    imageUrl: 'https://res.cloudinary.com/dhyds3low/image/upload/v1780461797/passport_style_crop_2_bbcati.jpg',
    gopiMandal: 0,
    notes: '',
    years: {
      'year2023_24': { capital: 0, expense: 0, profit: 0, remainingAmount: 0 },
      'year2024_25': { capital: 0, expense: 0, profit: 0, remainingAmount: 0 }
    }
  },
  {
    nameEn: 'A J PATEL',
    nameGu: 'એ. જે. પટેલ',
    imageUrl: 'https://res.cloudinary.com/dhyds3low/image/upload/v1780461797/passport_style_crop_rer4eo.jpg',
    gopiMandal: 0,
    notes: '',
    years: {
      'year2023_24': { capital: 0, expense: 0, profit: 0, remainingAmount: 0 },
      'year2024_25': { capital: 0, expense: 0, profit: 0, remainingAmount: 0 }
    }
  },
  {
    nameEn: 'S C MODI',
    nameGu: 'એસ. સી. મોદી',
    imageUrl: 'https://res.cloudinary.com/dhyds3low/image/upload/v1780461798/passport_style_crop_3_tfqrli.jpg',
    gopiMandal: 0,
    notes: '',
    years: {
      'year2023_24': { capital: 0, expense: 0, profit: 0, remainingAmount: 0 },
      'year2024_25': { capital: 0, expense: 0, profit: 0, remainingAmount: 0 }
    }
  },
  {
    nameEn: 'S B PATEL',
    nameGu: 'એસ. બી. પટેલ',
    imageUrl: 'https://res.cloudinary.com/dhyds3low/image/upload/v1780461798/passport_style_crop_4_runlte.jpg',
    gopiMandal: 0,
    notes: '',
    years: {
      'year2023_24': { capital: 0, expense: 0, profit: 0, remainingAmount: 0 },
      'year2024_25': { capital: 0, expense: 0, profit: 0, remainingAmount: 0 }
    }
  },
  {
    nameEn: 'P M PRAJAPATI',
    nameGu: 'પી. એમ. પ્રજાપતિ',
    imageUrl: 'https://res.cloudinary.com/dhyds3low/image/upload/v1780461797/passport_style_crop_5_tfpxn8.jpg',
    gopiMandal: 0,
    notes: '',
    years: {
      'year2023_24': { capital: 0, expense: 0, profit: 0, remainingAmount: 0 },
      'year2024_25': { capital: 0, expense: 0, profit: 0, remainingAmount: 0 }
    }
  }
];

async function seed() {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...\n');

    // Clear existing data
    await User.deleteMany({});
    await Member.deleteMany({});
    await YearlyReport.deleteMany({});
    await AppState.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create shared user
    const adminUsername = process.env.ADMIN_USERNAME || 'jaymataji';
    const adminPassword = process.env.ADMIN_PASSWORD || 'sarangpur-kahoda';

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.create({
      username: adminUsername,
      password: hashedPassword
    });
    console.log(`👤 Created user: ${adminUsername} / (hidden password)`);

    // Create members
    for (const memberData of MEMBERS) {
      const member = await Member.create(memberData);
      console.log(`👥 Created member: ${member.nameEn} (${member.nameGu})`);
    }

    // Create default master summary report
    const masterSummary = new YearlyReport({
      reportType: 'master_summary',
      years: ['2023', '2024'],
      masterSummary: [
        { key: 'aavak', labelGujarati: 'આવક', values: new Map([['2023', 0], ['2024', 0]]), total: 0 },
        { key: 'bakiKharcha', labelGujarati: 'બાકી ખર્ચ', values: new Map([['2023', 0], ['2024', 0]]), total: 0 },
        { key: 'vadheliRakam', labelGujarati: 'વધેલ રકમ', values: new Map([['2023', 0], ['2024', 0]]), total: 0 },
        { key: 'nafoo', labelGujarati: 'નફો', values: new Map([['2023', 0], ['2024', 0]]), total: 0 },
        { key: 'holding', labelGujarati: 'હોલ્ડિંગ', values: new Map([['2023', 0], ['2024', 0]]), total: 0 },
        { key: 'gopiMandal', labelGujarati: 'ગોપી મંડળ', values: new Map([['2023', 0], ['2024', 0]]), total: 0 },
        { key: 'ekandKul', labelGujarati: 'એકંદર કુલ', values: new Map([['2023', 0], ['2024', 0]]), total: 0 },
      ]
    });
    await masterSummary.save();
    console.log('📊 Created master summary report');

    console.log('\n✅ Database seeded successfully!');
    console.log(`   Login: ${process.env.ADMIN_USERNAME || 'jaymataji'} / (hidden password)`);
    console.log('   Members: 5');
    console.log('   Years: 2023, 2024\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();

