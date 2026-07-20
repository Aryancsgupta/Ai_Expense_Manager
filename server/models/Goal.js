const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 0.01,
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    deadline: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);
