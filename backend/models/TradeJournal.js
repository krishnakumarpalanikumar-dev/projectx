import mongoose from 'mongoose';

const tradeJournalSchema = new mongoose.Schema({
  pair: { type: String, required: true },
  direction: { type: String, enum: ['LONG', 'SHORT'], required: true },
  entry: { type: Number, required: true },
  exit: { type: Number, required: true },
  pnl: { type: Number, required: true },
  notes: { type: String },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('TradeJournal', tradeJournalSchema);
