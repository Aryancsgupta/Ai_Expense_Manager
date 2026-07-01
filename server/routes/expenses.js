const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const { Parser } = require('json2csv');
const processRecurringExpenses = require('../utils/recurring');
const axios = require('axios');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensuring we use an absolute path for uploads folder
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });



router.get('/', auth, async (req, res) => {
    try {
        const { search, category, startDate, endDate, minAmount, maxAmount } = req.query;
        
        let query = { user: req.user.id };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) query.category = category;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = Number(minAmount);
            if (maxAmount) query.amount.$lte = Number(maxAmount);
        }

        const expenses = await Expense.find(query).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/export', auth, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
        
        // Format expenses to include date with time
        const formattedExpenses = expenses.map(expense => ({
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            date: new Date(expense.date).toLocaleString('en-IN'), // Formats to include both date and time (DD/MM/YYYY, HH:MM:SS)
            description: expense.description,
            currency: expense.currency
        }));
        
        const fields = ['title', 'amount', 'category', 'date', 'description', 'currency'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(formattedExpenses);

        res.header('Content-Type', 'text/csv');
        res.attachment('expenses.csv');
        res.send(csv);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// Helper function to get exchange rate
const getExchangeRate = async (fromCurrency, toCurrency) => {
    try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        return response.data.rates[toCurrency];
    } catch (error) {
        console.error('Error fetching exchange rate:', error.message);
        return null;
    }
};

router.post('/', [auth, upload.single('bill')], async (req, res) => {
    const { title, amount, category, description, date, isRecurring, frequency, currency } = req.body;
    const billUrl = req.file ? `/uploads/${req.file.filename}` : '';

    try {
        if (parseFloat(amount) <= 0) {
            return res.status(400).json({ msg: 'Amount must be positive' });
        }
        
        // Get user's native currency
        const user = await User.findById(req.user.id);
        const nativeCurrency = user.currency;
        
        let finalAmount = parseFloat(amount);
        let finalCurrency = currency;
        let originalAmt = parseFloat(amount);
        
        // If expense currency is different from native, convert it
        if (currency !== nativeCurrency) {
            const rate = await getExchangeRate(currency, nativeCurrency);
            if (rate) {
                finalAmount = parseFloat((parseFloat(amount) * rate).toFixed(2));
                finalCurrency = nativeCurrency;
            }
        }
        
        const newExpense = new Expense({
            title,
            amount: finalAmount,
            category,
            description,
            date,
            billUrl,
            user: req.user.id,
            isRecurring: isRecurring === 'true',
            frequency,
            currency: finalCurrency,
            originalAmount: originalAmt
        });

        const expense = await newExpense.save();
        
        // Process recurring expenses immediately after creating a new recurring expense
        if (expense.isRecurring) {
            await processRecurringExpenses();
        }
        
        res.json(expense);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



router.put('/:id', auth, async (req, res) => {
    const { title, amount, category, description, date } = req.body;

    const expenseFields = {};
    if (title) expenseFields.title = title;
    if (amount) {
        if (parseFloat(amount) <= 0) {
            return res.status(400).json({ msg: 'Amount must be positive' });
        }
        expenseFields.amount = amount;
    }
    if (category) expenseFields.category = category;
    if (description) expenseFields.description = description;
    if (date) expenseFields.date = date;

    try {
        let expense = await Expense.findById(req.params.id);

        if (!expense) return res.status(404).json({ msg: 'Expense not found' });

        if (expense.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        expense = await Expense.findByIdAndUpdate(
            req.params.id,
            { $set: expenseFields },
            { new: true }
        );

        res.json(expense);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



router.delete('/:id', auth, async (req, res) => {
    try {
        let expense = await Expense.findById(req.params.id);

        if (!expense) return res.status(404).json({ msg: 'Expense not found' });

        if (expense.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Expense.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Expense removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Manual endpoint to trigger recurring expenses processing
router.post('/process-recurring', auth, async (req, res) => {
    try {
        await processRecurringExpenses();
        res.json({ msg: 'Recurring expenses processed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
