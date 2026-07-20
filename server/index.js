const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

const processRecurringExpenses = require('./utils/recurring');
const { convertExpensesToNativeCurrency } = require('./utils/currencyConverter');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

console.log('Frontend URL from env:', process.env.FRONTEND_URL);

// MAIN TOPIC -> CORS cross origin resource sharing
app.use(cors({
    origin: ['https://ai-expense-manager-pi.vercel.app', process.env.FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token', 'x-timezone']
}));


const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

const db = process.env.MONGO_URI;

mongoose
    .connect(db)
    .then(() => {
        console.log('MongoDB Connected');
        processRecurringExpenses();
        
        // Schedule recurring expenses to run every hour
        cron.schedule('0 * * * *', async () => {
            await processRecurringExpenses();
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });
        
        // Schedule currency conversion to run daily at midnight (0 0 * * *)
        cron.schedule('0 0 * * *', async () => {
            await convertExpensesToNativeCurrency();
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata" // Adjust timezone as needed
        });
        
        console.log('Recurring expenses job scheduled to run every hour');
        console.log('Currency conversion job scheduled to run daily at midnight');
    })
    .catch((err) => console.log(err));

// Root Route
app.get('/', (req, res) => {
    res.json({ message: "AI Expense Manager API is running..." });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/feedback', require('./routes/feedback'));


app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
