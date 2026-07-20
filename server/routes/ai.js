const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, 'ocr_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const hasGroqKey = process.env.GROQ_API_KEY &&
    process.env.GROQ_API_KEY !== 'your_groq_api_key_here' &&
    process.env.GROQ_API_KEY.startsWith('gsk_');

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || 'dummy_api_key_placeholder',
    baseURL: process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined
});

const AI_MODEL = process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo";

router.post('/scan', [auth, upload.single('bill')], async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    try {
        const { data: { text } } = await Tesseract.recognize(
            req.file.path,
            'eng',
            { logger: m => console.log(m) }
        );

        // Cleanup file after OCR
        fs.unlinkSync(req.file.path);

        const prompt = `
            Extract expense details from the following text extracted from a bill image.
            Return a JSON object with: title, amount (number), category (one of [Food, Transport, Utilities, Entertainment, Health, Shopping, Travel, Education, Other]), and date (YYYY-MM-DD).
            If a field is not found, use a reasonable guess or leave empty.
            
            Text: ${text}
        `;

        const response = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: "user", content: prompt }],
        });

        // Extract JSON safely – model may wrap it in markdown code fences
        let rawContent = response.choices[0].message.content.trim();
        const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) rawContent = jsonMatch[1].trim();
        const details = JSON.parse(rawContent);
        res.json(details);
    } catch (err) {
        console.error('OCR/AI Error:', err.message);
        res.status(500).json({ msg: 'Failed to scan bill', error: err.message });
    }
});

router.post('/categorize', auth, async (req, res) => {
    const { description, amount, title } = req.body;

    try {
        console.log('AI categorization request received for:', title);

        if (!hasGroqKey && !process.env.OPENAI_API_KEY) {
            console.warn('AI API Key is missing. Falling back to "Other".');
            return res.json({ category: 'Other', msg: 'AI Key missing' });
        }

        const prompt = `
      Based on the following expense details, suggest a category from this list: [Food, Transport, Utilities, Entertainment, Health, Shopping, Travel, Education, Other].
      Return ONLY the category name.
      
      Expense: ${title}
      Description: ${description}
      Amount: ${amount}
    `;

        const response = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 10,
            temperature: 0.3,
        });

        const suggestedCategory = response.choices[0].message.content.trim();
        console.log('AI suggested category:', suggestedCategory);
        res.json({ category: suggestedCategory });
    } catch (err) {
        console.error('AI Categorization Error:', err.message);
        try {
            const errorLog = `[${new Date().toISOString()}] Error for ${title}: ${err.message}\nStatus: ${err.status}\nCode: ${err.code}\n\n`;
            fs.appendFileSync(path.join(__dirname, '../ai_errors.log'), errorLog);
        } catch (fsErr) {
            console.error('Failed to log error to file:', fsErr.message);
        }
        res.status(200).json({
            category: 'Other',
            error: err.message,
            isFallback: true
        });
    }
});

router.get('/insights', auth, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id });

        if (expenses.length === 0) {
            return res.json({ insight: "No expenses recorded yet. Add some expenses to get insights!" });
        }
        if (!hasGroqKey && !process.env.OPENAI_API_KEY) {
            return res.json({ insight: "AI Insights are unavailable. Please add GROQ_API_KEY or OPENAI_API_KEY to your .env file." });
        }

        const { lang = 'English' } = req.query;
        const expenseSummary = expenses.map(e => `${e.date.toISOString().split('T')[0]}: ${e.title} ($${e.amount}) - ${e.category}`).join('\n');

        const prompt = `
      Analyze the following expense history and provide 3 short, actionable bullet points on spending habits and 1 saving tip.
      Keep it friendly and concise.
      VERY IMPORTANT: The entire response MUST be in ${lang}.

      ${expenseSummary}
    `;

        const response = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1000,
            temperature: 0.7,
        });

        res.json({ insight: response.choices[0].message.content });

    } catch (err) {
        console.error('AI Insights Error:', err.message);
        try {
            const errorLog = `[${new Date().toISOString()}] Insights Error: ${err.message}\nStatus: ${err.status}\nCode: ${err.code}\n\n`;
            fs.appendFileSync(path.join(__dirname, '../ai_errors.log'), errorLog);
        } catch (fsErr) {
            console.error('Failed to log error to file:', fsErr.message);
        }

        let fallbackMsg = "We're having trouble connecting to the AI service right now.";

        if (err.code === 'insufficient_quota') {
            fallbackMsg = "AI Insights are currently unavailable because your OpenAI API quota has been exceeded. Please check your billing details at platform.openai.com.";
        } else if (err.status === 401) {
            fallbackMsg = "AI Insights error: The API Key provided is invalid. Please check your .env file.";
        }

        res.json({
            insight: fallbackMsg,
            error: err.message,
            code: err.code,
            isFallback: true
        });
    }
});

// @route   GET api/ai/forecast
// @desc    AI-powered budget forecast based on spending velocity
router.get('/forecast', auth, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id });
        if (expenses.length === 0) {
            return res.json({ forecast: null, msg: 'No expenses found to forecast.' });
        }
        if (!hasGroqKey && !process.env.OPENAI_API_KEY) {
            return res.json({ forecast: null, msg: 'AI API key missing.' });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysPassed = now.getDate();
        const daysLeft = daysInMonth - daysPassed;

        const thisMonthExpenses = expenses.filter(e => new Date(e.date) >= startOfMonth);
        const totalSpentThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Category breakdown
        const categoryMap = {};
        for (const e of thisMonthExpenses) {
            if (!categoryMap[e.category]) categoryMap[e.category] = 0;
            categoryMap[e.category] += e.amount;
        }
        const categorySummary = Object.entries(categoryMap)
            .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(2)}`)
            .join(', ');

        const dailyRate = daysPassed > 0 ? totalSpentThisMonth / daysPassed : 0;
        const projectedTotal = totalSpentThisMonth + (dailyRate * daysLeft);

        const prompt = `
You are a personal finance advisor. Given spending data for this month:
- Days elapsed: ${daysPassed}/${daysInMonth}
- Total spent so far: ₹${totalSpentThisMonth.toFixed(2)}
- Projected total by month end (at current rate): ₹${projectedTotal.toFixed(2)}
- Category breakdown: ${categorySummary || 'N/A'}

Provide:
1. A one-sentence forecast summary.
2. Top 2 specific actionable tips to reduce spending.
3. Which category is highest risk.

Keep it short, friendly, and in English. Format as plain text bullet points.`;

        const response = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 400,
            temperature: 0.6,
        });

        res.json({
            forecast: response.choices[0].message.content,
            totalSpentThisMonth,
            projectedTotal,
            daysPassed,
            daysInMonth,
            daysLeft,
            dailyRate,
            categoryBreakdown: categoryMap,
        });
    } catch (err) {
        console.error('AI Forecast Error:', err.message);
        res.status(500).json({ msg: 'Failed to generate forecast', error: err.message });
    }
});

// @route   POST api/ai/split-bill
// @desc    OCR scan a receipt and split into multiple expense line items
router.post('/split-bill', [auth, upload.single('bill')], async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }
    try {
        const { data: { text } } = await Tesseract.recognize(
            req.file.path, 'eng', { logger: m => console.log(m) }
        );
        fs.unlinkSync(req.file.path);

        if (!hasGroqKey && !process.env.OPENAI_API_KEY) {
            return res.status(400).json({ msg: 'AI API key missing. Cannot split bill.' });
        }

        const prompt = `
Extract ALL individual line items from this bill/receipt text. 
For each item return an object with: { "title": string, "amount": number, "category": one of [Food, Transport, Utilities, Entertainment, Health, Shopping, Travel, Education, Other] }
Return ONLY a valid JSON array. No markdown, no explanation, no code fences.

Bill text:
${text}`;

        const response = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.2,
        });

        let rawContent = response.choices[0].message.content.trim();
        const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) rawContent = jsonMatch[0];
        const items = JSON.parse(rawContent);
        res.json({ items, rawText: text });
    } catch (err) {
        console.error('Bill Split Error:', err.message);
        res.status(500).json({ msg: 'Failed to split bill', error: err.message });
    }
});

module.exports = router;
