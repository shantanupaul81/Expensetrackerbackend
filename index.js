import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import connectDB from './config/db.js';

dotenv.config();
const app = express();
const PORT =  9000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Database Connection
connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));