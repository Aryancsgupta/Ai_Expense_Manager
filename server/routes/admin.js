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

        const stats = await Expense.aggregate([
            {
                $group: {
                    _id: null,
                    totalVolume: { $sum: "$amount" }
                }
            }
        ]);

        const totalVolume = stats.length > 0 ? stats[0].totalVolume : 0;

        res.json({
            totalUsers,
            totalExpenses,
            totalVolume
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/users', auth, admin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
