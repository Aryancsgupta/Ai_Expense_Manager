const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const hasGroqKey = process.env.GROQ_API_KEY &&
    process.env.GROQ_API_KEY !== 'your_groq_api_key_here' &&
    process.env.GROQ_API_KEY.startsWith('gsk_');

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined
});

const AI_MODEL = process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo";

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

module.exports = router;
