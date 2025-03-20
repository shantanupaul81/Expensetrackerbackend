import mongoose from 'mongoose';

const SummarySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalIncome: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Summary', SummarySchema);
