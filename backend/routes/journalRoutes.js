import express from 'express';
import TradeJournal from '../models/TradeJournal.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const journals = await TradeJournal.find().sort({ date: -1 });
    res.json(journals);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { pair, direction, entry, exit, pnl, notes } = req.body;
    const newJournal = new TradeJournal({
      pair, direction, entry, exit, pnl, notes
    });
    const saved = await newJournal.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await TradeJournal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
