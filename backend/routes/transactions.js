const express = require('express');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/transactions - list all with optional filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { year, memberId, type } = req.query;
    const filter = {};

    if (year) filter.year = year;
    if (memberId) filter.memberId = memberId;
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter)
      .populate('memberId', 'name nameGujarati')
      .sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'વ્યવહારોની માહિતી મેળવવામાં ભૂલ' });
  }
});

// POST /api/transactions - create new transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('data-updated', { type: 'transaction', id: transaction._id });
    }

    res.status(201).json({ message: 'વ્યવહાર ઉમેરાયો', transaction }); // Transaction added
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'વ્યવહાર ઉમેરવામાં ભૂલ' });
  }
});

// PUT /api/transactions/:id - update transaction
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'વ્યવહાર મળ્યો નથી' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('data-updated', { type: 'transaction', id: transaction._id });
    }

    res.json({ message: 'વ્યવહાર અપડેટ થયો', transaction });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'વ્યવહાર અપડેટ કરવામાં ભૂલ' });
  }
});

// DELETE /api/transactions/:id - delete transaction
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'વ્યવહાર મળ્યો નથી' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('data-updated', { type: 'transaction', id: req.params.id });
    }

    res.json({ message: 'વ્યવહાર દૂર કરાયો' }); // Transaction removed
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'વ્યવહાર દૂર કરવામાં ભૂલ' });
  }
});

module.exports = router;
