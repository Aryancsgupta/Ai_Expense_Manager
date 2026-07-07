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

// @route   PUT api/budget/:id
// @desc    Update a budget amount
router.put('/:id', auth, async (req, res) => {
    const { amount } = req.body;
    try {
        let budget = await Budget.findById(req.params.id);
        if (!budget) return res.status(404).json({ msg: 'Budget not found' });
        if (budget.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        budget.amount = amount;
        await budget.save();
        res.json(budget);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/budget/:id
// @desc    Delete a budget
router.delete('/:id', auth, async (req, res) => {
    try {
        let budget = await Budget.findById(req.params.id);
        if (!budget) return res.status(404).json({ msg: 'Budget not found' });
        if (budget.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        await Budget.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Budget removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
