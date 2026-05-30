const express = require('express');
const Member = require('../models/Member');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/members - get all members
router.get('/', authMiddleware, async (req, res) => {
  try {
    const members = await Member.find().sort({ name: 1 });
    res.json(members);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ message: 'સભ્યોની માહિતી મેળવવામાં ભૂલ' });
  }
});

// GET /api/members/:id - get single member
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'સભ્ય મળ્યો નથી' }); // Member not found
    }
    res.json(member);
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ message: 'સભ્યની માહિતી મેળવવામાં ભૂલ' });
  }
});

// PUT /api/members/:id - update member data
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'સભ્ય મળ્યો નથી' });
    }

    const { yearlyData, name, nameGujarati } = req.body;

    if (name) member.name = name;
    if (nameGujarati) member.nameGujarati = nameGujarati;

    if (yearlyData) {
      member.yearlyData = yearlyData;
    }

    await member.save(); // triggers pre-save auto-calculations

    // Emit real-time update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('member-updated', { memberId: member._id, member });
      io.emit('data-updated', { type: 'member', id: member._id });
    }

    res.json({ message: 'સભ્યની માહિતી અપડેટ થઈ', member }); // Member info updated
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ message: 'સભ્યની માહિતી અપડેટ કરવામાં ભૂલ' });
  }
});

// PUT /api/members/:id/yearly/:year - update specific year data for a member
router.put('/:id/yearly/:year', authMiddleware, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'સભ્ય મળ્યો નથી' });
    }

    const yearIndex = member.yearlyData.findIndex(yd => yd.year === req.params.year);
    if (yearIndex === -1) {
      // Add new year
      member.yearlyData.push({ year: req.params.year, ...req.body });
    } else {
      // Update existing year
      Object.assign(member.yearlyData[yearIndex], req.body);
    }

    await member.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('member-updated', { memberId: member._id, member });
      io.emit('data-updated', { type: 'member', id: member._id });
    }

    res.json({ message: 'વાર્ષિક ડેટા અપડેટ થયો', member });
  } catch (error) {
    console.error('Update yearly data error:', error);
    res.status(500).json({ message: 'વાર્ષિક ડેટા અપડેટ કરવામાં ભૂલ' });
  }
});

module.exports = router;
