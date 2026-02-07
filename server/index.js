const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.json());
console.log('Frontend URL from env:', process.env.FRONTEND_URL);

app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'].filter(Boolean);
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(o => origin.startsWith(o))) {
            callback(null, true);
        } else {
            console.warn(`Origin ${origin} not allowed by CORS`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token']
}));


const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

const db = process.env.MONGO_URI;

mongoose
    .connect(db)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log(err));

// Root Route
app.get('/', (req, res) => {
    res.json({ message: "AI Expense Manager API is running..." });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
