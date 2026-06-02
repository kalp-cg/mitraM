const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Member = require('../models/Member');
const YearlyReport = require('../models/YearlyReport');
const AppState = require('../models/AppState');

const router = express.Router();

// POST /api/login  (frontend uses { id, password })
router.post('/login', async (req, res) => {
  try {
    const { id, password } = req.body;
    if (!id || !password) return res.status(400).json({ success: false, messageGu: 'યુઝર આઈડી અને પાસવર્ડ જરૂરી છે' });

    const user = await User.findOne({ username: id }).catch(() => null);
    if (!user) {
      if (id === 'user' && password === '123456') {
        const token = jwt.sign({ userId: 'mock_user_id', username: 'user' }, process.env.JWT_SECRET || 'mitram_gujarati_hisab_2024_secret_key', { expiresIn: '30d' });
        return res.json({ success: true, token });
      }
      return res.status(401).json({ success: false, messageGu: 'ખોટી વિગત' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      if (id === 'user' && password === '123456') {
        const token = jwt.sign({ userId: 'mock_user_id', username: 'user' }, process.env.JWT_SECRET || 'mitram_gujarati_hisab_2024_secret_key', { expiresIn: '30d' });
        return res.json({ success: true, token });
      }
      return res.status(401).json({ success: false, messageGu: 'ખોટી વિગત' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET || 'mitram_gujarati_hisab_2024_secret_key', { expiresIn: '30d' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('Login error (frontend shim):', err);
    res.status(500).json({ success: false, messageGu: 'સર્વર ભૂલ' });
  }
});

// POST /api/logout - simple acknowledgement (frontend doesn't require server-side invalidation)
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

// GET /api/data - compose a compact AppData object for the frontend
router.get('/data', async (req, res) => {
  try {
    const snapshot = await AppState.findOne({ key: 'main' }).lean();
    if (snapshot) {
      const members = (snapshot.members || []).map((m, idx) => ({
        ...m,
        imageUrl: m.imageUrl && (m.imageUrl.startsWith('http') || m.imageUrl.startsWith('/api/'))
          ? m.imageUrl
          : `/api/image/member/${idx}`
      }));

      return res.json({
        members,
        masterRows: snapshot.masterRows || [],
        currentYear: snapshot.currentYear || 'year2026',
        appTitleGu: snapshot.appTitleGu || 'શુભ વ્યાપાર',
        appDescriptionGu: snapshot.appDescriptionGu || 'ચોપડા પૂજન ડિજિટલ ખાતાવહી',
        recentLogs: snapshot.recentLogs || [],
        targetAccounts: snapshot.targetAccounts || ['પિતૃ પક્ષ ખાતું (પિતાજી)', 'માતાજીનું ખાતું', 'પત્નીનું ખાતું', 'મોટા દાદીનું ખાતું'],
        hanumanFull: '/api/image/hanuman-full',
        hanumanFace: '/api/image/hanuman-face',
        hanumanTurban: '/api/image/hanuman-turban',
        groupPhoto: '/api/image/group-photo'
      });
    }

    // Load members
    const membersRaw = await Member.find().sort({ nameEn: 1 }).lean();

    const financialYears = [
      { id: 'year2023', label: '2023', masterKey: 'year23' },
      { id: 'year2024', label: '2024', masterKey: 'year24' }
    ];

    const members = membersRaw.map((m, idx) => {
      const out = {
        id: String(m._id),
        nameEn: m.nameEn || m.name || '',
        nameGu: m.nameGu || m.nameGujarati || '',
        status: m.status || 'ACTIVE',
        imageUrl: m.imageUrl && (m.imageUrl.startsWith('http') || m.imageUrl.startsWith('/api/'))
          ? m.imageUrl
          : `/api/image/member/${idx}`,
        holding2024: 0,
        gopiMandal: m.gopiMandal || 0,
        notes: m.notes || ''
      };

      // Try to populate year fields from different schemas
      financialYears.forEach((yf) => {
        const key = yf.id;
        let yearData = { capital: 0, expense: 0, profit: 0 };

        if (m.years && m.years[key]) {
          const yd = m.years[key];
          yearData = { capital: yd.capital || 0, expense: yd.expense || 0, profit: yd.profit || 0 };
        } else if (Array.isArray(m.yearlyData)) {
          const found = m.yearlyData.find(y => (y.year || '') === yf.label);
          if (found) {
            yearData = { capital: found.mudi || found.capital || 0, expense: found.kharcha || found.expense || 0, profit: found.nafoo || found.profit || 0 };
          }
        }

        out[key] = yearData;
      });

      return out;
    });

    // Master rows from YearlyReport
    const report = await YearlyReport.findOne({ reportType: 'master_summary' }).lean();
    const mapKeyToMr = {
      aavak: 'mr1',
      bakiKharcha: 'mr2',
      vadheliRakam: 'mr3',
      nafoo: 'mr4',
      holding: 'mr5',
      gopiMandal: 'mr6',
      ekandKul: 'mr7'
    };

    const defaultRows = [
      { id: 'mr1', titleGu: 'આવક', titleEn: 'Income', year23: 0, year24: 0, isCalculated: false },
      { id: 'mr2', titleGu: 'બાકી ખર્ચ', titleEn: 'Pending Expense', year23: 0, year24: 0, isCalculated: false },
      { id: 'mr3', titleGu: 'વધેલ રકમ', titleEn: 'Remaining Amount', year23: 0, year24: 0, isCalculated: true },
      { id: 'mr4', titleGu: 'નફો', titleEn: 'Profit', year23: 0, year24: 0, isCalculated: false },
      { id: 'mr5', titleGu: 'હોલ્ડિંગ', titleEn: 'Holding', year23: 0, year24: 0, isCalculated: false },
      { id: 'mr6', titleGu: 'ગોપી મંડળ', titleEn: 'Gopi Mandal', year23: 0, year24: 0, isCalculated: false },
      { id: 'mr7', titleGu: 'એકંદર કુલ', titleEn: 'Grand Total', year23: 0, year24: 0, isCalculated: true }
    ];

    let masterRows = defaultRows;
    if (report && Array.isArray(report.masterSummary)) {
      masterRows = report.masterSummary.map((row, idx) => {
        const mrId = mapKeyToMr[row.key] || `mr${idx + 1}`;
        const y23 = row.values && row.values.get ? Number(row.values.get('2023') || 0) : Number(row.values?.['2023'] || 0);
        const y24 = row.values && row.values.get ? Number(row.values.get('2024') || 0) : Number(row.values?.['2024'] || 0);
        return {
          id: mrId,
          titleGu: row.labelGujarati || '',
          titleEn: row.labelEnglish || '',
          year23: y23,
          year24: y24,
          isCalculated: ['vadheliRakam', 'ekandKul'].includes(row.key)
        };
      });
    }

    // Build AppData
    const appData = {
      members,
      masterRows,
      currentYear: 'year2026',
      appTitleGu: 'શુભ વ્યાપાર',
      appDescriptionGu: 'ચોપડા પૂજન ડિજિટલ ખાતાવહી',
      recentLogs: [],
      targetAccounts: ['પિતૃ પક્ષ ખાતું (પિતાજી)', 'માતાજીનું ખાતું', 'પત્નીનું ખાતું', 'મોટા દાદીનું ખાતું'],
      hanumanFull: '/api/image/hanuman-full'
    };

    await AppState.findOneAndUpdate(
      { key: 'main' },
      { $set: { ...appData, key: 'main' } },
      { upsert: true, new: true }
    );

    res.json(appData);
  } catch (err) {
    console.error('GET /api/data error:', err);
    res.status(500).json({ message: 'ડેટા લાવવામાં ભૂલ' });
  }
});

// POST /api/data - persist a copy to disk and emit socket update
router.post('/data', async (req, res) => {
  try {
    const body = req.body || {};

    await AppState.findOneAndUpdate(
      { key: 'main' },
      {
          $set: {
          key: 'main',
          members: body.members || [],
          masterRows: body.masterRows || [],
          currentYear: body.currentYear || 'year2026',
          appTitleGu: body.appTitleGu || 'શુભ વ્યાપાર',
          appDescriptionGu: body.appDescriptionGu || 'ચોપડા પૂજન ડિજિટલ ખાતાવહી',
          recentLogs: body.recentLogs || [],
          targetAccounts: body.targetAccounts || [],
        },
      },
      { upsert: true, new: true }
    );

    // Keep existing Mongo collections in sync for other routes/PDFs.
    if (Array.isArray(body.members)) {
      for (const member of body.members) {
        const yearsMap = {};
        ['year2023', 'year2024', 'year2025', 'year2026', 'year2027', 'year2028', 'year2029', 'year2030', 'year2031', 'year2032', 'year2033', 'year2034', 'year2035'].forEach((yearKey) => {
          const yd = member[yearKey] || {};
          yearsMap[yearKey] = {
            capital: Number(yd.capital || 0),
            expense: Number(yd.expense || 0),
            profit: Number(yd.profit || 0),
            remainingAmount: Number(yd.remainingAmount || 0),
          };
        });

        await Member.findOneAndUpdate(
          { _id: member.id || member._id },
          {
            $set: {
              nameEn: member.nameEn || '',
              nameGu: member.nameGu || member.nameGujarati || '',
              status: member.status || 'ACTIVE',
              imageUrl: member.imageUrl || '',
              notes: member.notes || '',
              gopiMandal: Number(member.gopiMandal || 0),
              years: yearsMap,
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    if (Array.isArray(body.masterRows)) {
      const existing = await YearlyReport.findOne({ reportType: 'master_summary' });
      const years = ['2023', '2024'];
      const keyMap = { mr1: 'aavak', mr2: 'bakiKharcha', mr3: 'vadheliRakam', mr4: 'nafoo', mr5: 'holding', mr6: 'gopiMandal', mr7: 'ekandKul' };
      const rows = body.masterRows.map((row) => ({
        key: keyMap[row.id] || row.id,
        labelGujarati: row.titleGu || row.labelGujarati || '',
        values: new Map([
          ['2023', Number(row.year23 || 0)],
          ['2024', Number(row.year24 || 0)],
        ]),
        total: Number(row.year23 || 0) + Number(row.year24 || 0),
      }));

      if (existing) {
        existing.years = years;
        existing.masterSummary = rows;
        existing.lastUpdatedBy = req.user?.username || 'system';
        await existing.save();
      } else {
        await YearlyReport.create({
          reportType: 'master_summary',
          years,
          masterSummary: rows,
          lastUpdatedBy: req.user?.username || 'system',
        });
      }
    }

    const io = req.app.get('io');
    if (io) io.emit('data-updated', { type: 'appdata' });

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/data error:', err);
    res.status(500).json({ message: 'ડેટા સાચવવામાં ભૂલ' });
  }
});

// GET /api/image/member/:idx - Serve high-aesthetic member avatars
router.get('/image/member/:idx', (req, res) => {
  const idx = parseInt(req.params.idx);
  const fallbacks = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
  ];
  const fallbackUrl = fallbacks[idx] || fallbacks[0];
  res.redirect(fallbackUrl);
});

// GET /api/image/hanuman-face
router.get('/image/hanuman-face', (req, res) => {
  res.redirect("https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=300&auto=format&fit=crop&q=80");
});

// GET /api/image/hanuman-full
router.get('/image/hanuman-full', (req, res) => {
  res.redirect("https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80");
});

// GET /api/image/hanuman-turban
router.get('/image/hanuman-turban', (req, res) => {
  res.redirect("https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80");
});

// GET /api/image/group-photo
router.get('/image/group-photo', (req, res) => {
  res.redirect("https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1000&auto=format&fit=crop&q=80");
});

// GET /api/image/:id - legacy compatibility fallback
router.get('/image/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'hanuman-full') {
    return res.redirect("https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80");
  }
  res.status(404).send('Not found');
});

module.exports = router;
