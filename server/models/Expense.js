const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01,
    },
    category: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String,
    },
    billUrl: {
        type: String,
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    frequency: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
        default: 'none',
    },
    lastGeneratedDate: {
        type: Date,
    },
    currency: {
        type: String,
        default: 'USD',
    },
    originalAmount: {
        type: Number,
    },
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
