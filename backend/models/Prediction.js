import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pair: { type: String, required: true },
  pred: { type: String, required: true },
  actual: { type: String, required: true },
  pnl: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Prediction', predictionSchema);
