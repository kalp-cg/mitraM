const express = require('express');
const IpoTrade = require('../models/IpoTrade');

const router = express.Router();

// GET /api/ipo - list all IPO trades with optional filters
router.get('/', async (req, res) => {
  try {
    const { year, status } = req.query;
    const filter = {};

    if (year) filter.year = year;
    if (status) filter.status = status;

    const trades = await IpoTrade.find(filter).sort({ buyDate: -1 });
    res.json(trades);
  } catch (error) {
    console.error('Get IPO trades error:', error);
    res.status(500).json({ message: 'IPO ટ્રેડ ડેટા મેળવવામાં ભૂલ' });
  }
});

// GET /api/ipo/summary - aggregated P&L summary
router.get('/summary', async (req, res) => {
  try {
    const trades = await IpoTrade.find().lean();

    const totalInvested = trades.reduce((sum, t) => sum + ((t.buyPrice || 0) * (t.quantity || 1)), 0);
    const totalSellValue = trades.filter(t => t.status === 'sold').reduce((sum, t) => sum + ((t.sellPrice || 0) * (t.quantity || 1)), 0);
    const totalProfitLoss = trades.filter(t => t.status === 'sold').reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const activeCount = trades.filter(t => t.status === 'holding').length;
    const soldCount = trades.filter(t => t.status === 'sold').length;
    const activeInvested = trades.filter(t => t.status === 'holding').reduce((sum, t) => sum + ((t.buyPrice || 0) * (t.quantity || 1)), 0);

    res.json({
      totalInvested,
      totalSellValue,
      totalProfitLoss,
      activeCount,
      soldCount,
      activeInvested,
      totalTrades: trades.length
    });
  } catch (error) {
    console.error('IPO summary error:', error);
    res.status(500).json({ message: 'IPO સમરી મેળવવામાં ભૂલ' });
  }
});

// POST /api/ipo - add new IPO trade
router.post('/', async (req, res) => {
  try {
    const trade = new IpoTrade(req.body);
    await trade.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('data-updated', { type: 'ipo', id: trade._id });
    }

    res.status(201).json({ message: 'IPO ટ્રેડ ઉમેરાયો', trade });
  } catch (error) {
    console.error('Create IPO trade error:', error);
    res.status(500).json({ message: 'IPO ટ્રેડ ઉમેરવામાં ભૂલ' });
  }
});

// PUT /api/ipo/:id - update trade (e.g. mark as sold)
router.put('/:id', async (req, res) => {
  try {
    const trade = await IpoTrade.findById(req.params.id);
    if (!trade) {
      return res.status(404).json({ message: 'IPO ટ્રેડ મળ્યો નથી' });
    }

    const { sellQuantity, status, sellPrice, sellDate, ...otherUpdates } = req.body;

    // Check for partial sell split
    if (status === 'sold' && typeof sellQuantity === 'number' && sellQuantity > 0 && sellQuantity < trade.quantity) {
      const originalQuantity = trade.quantity;
      const soldQuantity = sellQuantity;
      const remainingQuantity = originalQuantity - soldQuantity;

      // 1. Update the original trade to represent the SOLD portion
      trade.quantity = soldQuantity;
      trade.sellPrice = sellPrice;
      trade.sellDate = sellDate;
      trade.status = 'sold';
      
      // Copy other updates if any
      Object.assign(trade, otherUpdates);
      await trade.save(); // triggers pre-save P&L calculation

      // 2. Create a new trade for the REMAINING holding portion
      const remainingTrade = new IpoTrade({
        shareName: trade.shareName,
        buyDate: trade.buyDate,
        buyPrice: trade.buyPrice,
        sellPrice: 0,
        quantity: remainingQuantity,
        dematAccount: trade.dematAccount,
        status: 'holding',
        notes: trade.notes ? `${trade.notes} (બાકી વધેલ શેર)` : 'બાકી વધેલ શેર',
        year: trade.year
      });
      await remainingTrade.save();

      const io = req.app.get('io');
      if (io) {
        io.emit('data-updated', { type: 'ipo', id: trade._id });
      }

      return res.json({ 
        message: 'IPO ટ્રેડ ભાગીદારીમાં વેચાયો અને બાકીના શેર હોલ્ડિંગમાં રખાયા', 
        trade, 
        remainingTrade 
      });
    } else {
      // Normal update
      Object.assign(trade, req.body);
      await trade.save();

      const io = req.app.get('io');
      if (io) {
        io.emit('data-updated', { type: 'ipo', id: trade._id });
      }

      res.json({ message: 'IPO ટ્રેડ અપડેટ થયો', trade });
    }
  } catch (error) {
    console.error('Update IPO trade error:', error);
    res.status(500).json({ message: 'IPO ટ્રેડ અપડેટ કરવામાં ભૂલ' });
  }
});

// DELETE /api/ipo/:id - remove trade
router.delete('/:id', async (req, res) => {
  try {
    const trade = await IpoTrade.findByIdAndDelete(req.params.id);
    if (!trade) {
      return res.status(404).json({ message: 'IPO ટ્રેડ મળ્યો નથી' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('data-updated', { type: 'ipo', id: req.params.id });
    }

    res.json({ message: 'IPO ટ્રેડ દૂર કરાયો' });
  } catch (error) {
    console.error('Delete IPO trade error:', error);
    res.status(500).json({ message: 'IPO ટ્રેડ દૂર કરવામાં ભૂલ' });
  }
});

module.exports = router;
