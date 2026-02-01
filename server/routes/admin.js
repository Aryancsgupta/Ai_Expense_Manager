const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Expense = require('../models/Expense');
router.get('/system-stats', auth, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalExpenses = await Expense.countDocuments();
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
