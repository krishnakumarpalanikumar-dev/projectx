import express from 'express';
import Prediction from '../models/Prediction.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const predictions = await Prediction.find().sort({ timestamp: -1 });
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { pair, pred, actual, pnl } = req.body;
    const newPrediction = new Prediction({
      pair, pred, actual, pnl
    });
    const saved = await newPrediction.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Prediction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
