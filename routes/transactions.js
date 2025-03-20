import express from 'express';
import Transaction from '../models/Transaction.js';
import Summary from '../models/Summary.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Get All Transactions for the Logged-in User
router.get('/', authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Add a New Transaction & Update Summary
router.post('/', authMiddleware, async (req, res) => {
    try {
        let { type, amount, category } = req.body;

        // Ensure amount is a number
        amount = Number(amount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        // Create a new transaction
        const transaction = new Transaction({ 
            user: req.user.id, 
            type, 
            amount, 
            category 
        });
        await transaction.save();

        // Find or create summary document
        let summary = await Summary.findOne({ user: req.user.id });
        if (!summary) {
            summary = new Summary({ user: req.user.id, totalIncome: 0, totalExpenses: 0 });
        }

        // Debugging logs
        console.log(`Before Update -> Income: ${summary.totalIncome}, Expenses: ${summary.totalExpenses}`);

        // Update the total income or expenses
        if (type === 'income') {
            summary.totalIncome += amount;
        } else if (type === 'expense') {
            summary.totalExpenses += amount;
        }

        await summary.save();

        // Debugging logs
        console.log(`After Update -> Income: ${summary.totalIncome}, Expenses: ${summary.totalExpenses}`);

        res.json({ transaction, summary });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// ✅ Update a Transaction & Adjust Summary
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { type, amount, category } = req.body;
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Find the user's summary
        let summary = await Summary.findOne({ user: req.user.id });
        if (!summary) {
            return res.status(400).json({ message: 'Summary not found' });
        }

        // Adjust the summary before updating the transaction
        if (transaction.type === 'income') {
            summary.totalIncome -= transaction.amount;
        } else if (transaction.type === 'expense') {
            summary.totalExpenses -= transaction.amount;
        }

        // Update transaction
        transaction.type = type;
        transaction.amount = amount;
        transaction.category = category;
        await transaction.save();

        // Update summary with the new transaction values
        if (type === 'income') {
            summary.totalIncome += amount;
        } else if (type === 'expense') {
            summary.totalExpenses += amount;
        }

        await summary.save();

        res.json({ transaction, summary });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Delete a Transaction & Adjust Summary
// ✅ Delete a Transaction & Reset Summary if Empty
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Find the user's summary
        let summary = await Summary.findOne({ user: req.user.id });
        if (!summary) {
            return res.status(400).json({ message: 'Summary not found' });
        }

        // Adjust the summary before deleting the transaction
        if (transaction.type === 'income') {
            summary.totalIncome -= transaction.amount;
        } else if (transaction.type === 'expense') {
            summary.totalExpenses -= transaction.amount;
        }

        await transaction.deleteOne();

        // Check if there are remaining transactions
        const remainingTransactions = await Transaction.find({ user: req.user.id });

        // If no transactions remain, reset the summary
        if (remainingTransactions.length === 0) {
            summary.totalIncome = 0;
            summary.totalExpenses = 0;
        }

        await summary.save();

        res.json({ message: 'Transaction deleted successfully', summary });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// ✅ Get Summary
router.get('/summary', authMiddleware, async (req, res) => {
    try {
        const summary = await Summary.findOne({ user: req.user.id });

        if (!summary) {
            return res.json({ totalIncome: 0, totalExpenses: 0, balance: 0 });
        }

        // Ensure values are numbers
        const totalIncome = Number(summary.totalIncome) || 0;
        const totalExpenses = Number(summary.totalExpenses) || 0;
        const balance = totalIncome - totalExpenses;

        res.json({ totalIncome, totalExpenses, balance });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


export default router;
