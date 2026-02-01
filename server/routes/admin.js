const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Expense = require('../models/Expense');

// @route   GET /api/admin/system-stats
// @desc    Get system wide stats
// @access  Private/Admin
router.get('/system-stats', auth, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalExpenses = await Expense.countDocuments();

        // Calculate total volume transaction
        const expenses = await Expense.find();
        const totalVolume = expenses.reduce((acc, curr) => acc + curr.amount, 0);

        res.json({
            totalUsers,
            totalExpenses,
            totalVolume
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', auth, admin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
