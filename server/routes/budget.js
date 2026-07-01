const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @route   GET api/budget
// @desc    Get all budgets for current month
router.get('/', auth, async (req, res) => {
    try {
        const date = new Date();
        const month = date.getMonth();
        const year = date.getFullYear();

        const budgets = await Budget.find({ user: req.user.id, month, year });
        
        // Calculate spending for each budget category
        const budgetsWithSpending = await Promise.all(budgets.map(async (budget) => {
            const expenses = await Expense.find({
                user: req.user.id,
                category: budget.category,
                date: {
                    $gte: new Date(year, month, 1),
                    $lte: new Date(year, month + 1, 0)
                }
            });
            const spent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
            return {
                ...budget.toObject(),
                spent
            };
        }));

        res.json(budgetsWithSpending);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/budget
// @desc    Set or update a budget
router.post('/', auth, async (req, res) => {
    const { category, amount } = req.body;
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();

    try {
        let budget = await Budget.findOne({ user: req.user.id, category, month, year });

        if (budget) {
            budget.amount = amount;
            await budget.save();
        } else {
            budget = new Budget({
                user: req.user.id,
                category,
                amount,
                month,
                year
            });
            await budget.save();
        }

        res.json(budget);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
