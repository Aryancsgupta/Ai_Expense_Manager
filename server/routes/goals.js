const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');

// @route   GET api/goals
// @desc    Get all savings goals for current user
router.get('/', auth, async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user.id }).sort({ deadline: 1 });
        res.json(goals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/goals
// @desc    Create a new savings goal
router.post('/', auth, async (req, res) => {
    const { title, targetAmount, deadline, currentAmount } = req.body;

    try {
        const newGoal = new Goal({
            user: req.user.id,
            title,
            targetAmount: parseFloat(targetAmount),
            currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
            deadline: new Date(deadline)
        });

        const goal = await newGoal.save();
        res.json(goal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/goals/:id
// @desc    Update a savings goal
router.put('/:id', auth, async (req, res) => {
    const { title, targetAmount, currentAmount, deadline } = req.body;

    const goalFields = {};
    if (title !== undefined) goalFields.title = title;
    if (targetAmount !== undefined) goalFields.targetAmount = parseFloat(targetAmount);
    if (currentAmount !== undefined) goalFields.currentAmount = parseFloat(currentAmount);
    if (deadline !== undefined) goalFields.deadline = new Date(deadline);

    try {
        let goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ msg: 'Goal not found' });

        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        goal = await Goal.findByIdAndUpdate(
            req.params.id,
            { $set: goalFields },
            { new: true }
        );

        res.json(goal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/goals/:id
// @desc    Delete a savings goal
router.delete('/:id', auth, async (req, res) => {
    try {
        let goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ msg: 'Goal not found' });

        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Goal.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Goal removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
