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

function getAiClient() {
    const groqKey = process.env.GROQ_API_KEY;
    const hasGroq = groqKey && groqKey !== 'your_groq_api_key_here' && groqKey.startsWith('gsk_');
    const openaiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';

    if (hasGroq) {
        return {
            client: new OpenAI({
                apiKey: groqKey,
                baseURL: "https://api.groq.com/openai/v1"
            }),
            model: "llama-3.3-70b-versatile",
            isConfigured: true
        };
    }

    if (openaiKey) {
        return {
            client: new OpenAI({
                apiKey: openaiKey
            }),
            model: "gpt-3.5-turbo",
            isConfigured: true
        };
    }

    return {
        client: null,
        model: null,
        isConfigured: false
    };
}

// Fallback insights generator when AI API is unavailable
function generateRuleBasedInsights(expenses, lang = 'English') {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryMap = {};
    for (const e of expenses) {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    }
    const sortedCats = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats[0] ? sortedCats[0][0] : 'General';
    const topCatAmt = sortedCats[0] ? sortedCats[0][1] : 0;
    const topCatPercent = totalSpent > 0 ? Math.round((topCatAmt / totalSpent) * 100) : 0;

    const secondCat = sortedCats[1] ? sortedCats[1][0] : null;

    if (lang.toLowerCase().includes('hindi')) {
        return `📊 **खर्च विश्लेषण रिपोर्ट**:
• आपका सबसे बड़ा खर्च **${topCat}** श्रेणी में है (कुल खर्च का लगभग ${topCatPercent}%)।
• ${secondCat ? `दूसरी सबसे बड़ी श्रेणी **${secondCat}** है जिस पर ध्यान देने की आवश्यकता है।` : 'अपने दैनिक छोटे खर्चों पर नज़र रखें।'}
• कुल रिकॉर्ड किए गए खर्च: ${expenses.length} लेनदेन।

💡 **बचत टिप**:
${topCat} श्रेणी में गैर-जरूरी खर्चों को 10-15% कम करने का प्रयास करें और महीने के शुरू में ही बजट तय करें।`;
    }

    return `📊 **Spending Insights Summary**:
• **Top Spending Area**: Your highest expense is in **${topCat}**, accounting for ~${topCatPercent}% of total spending.
• ${secondCat ? `**Secondary Focus**: **${secondCat}** is your second largest expense category.` : '**Expense Tracking**: Consistent logging helps identify leakage.'}
• **Transaction Activity**: Analyzed across ${expenses.length} recorded transaction(s).

💡 **Actionable Saving Tip**:
Try reducing discretionary spend in ${topCat} by 10-15% next month and set a weekly target to keep your budget on track.`;
}

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
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const ai = getAiClient();
        if (ai.isConfigured) {
            const prompt = `
                Extract expense details from the following text extracted from a bill image.
                Return a JSON object with: title, amount (number), category (one of [Food, Transport, Utilities, Entertainment, Health, Shopping, Travel, Education, Other]), and date (YYYY-MM-DD).
                If a field is not found, use a reasonable guess or leave empty.
                
                Text: ${text}
            `;

            const response = await ai.client.chat.completions.create({
                model: ai.model,
                messages: [{ role: "user", content: prompt }],
            });

            let rawContent = response.choices[0].message.content.trim();
            const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) rawContent = jsonMatch[1].trim();
            const details = JSON.parse(rawContent);
            return res.json(details);
        }

        // Fallback simple regex extraction if AI is unavailable
        const amountMatch = text.match(/(?:total|amount|rs\.?|inr|\$|₹)\s*[:=]?\s*([0-9]+(?:\.[0-9]{2})?)/i) || text.match(/([0-9]+\.[0-9]{2})/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
        res.json({
            title: 'Scanned Bill',
            amount: amount,
            category: 'Other',
            date: new Date().toISOString().split('T')[0]
        });
    } catch (err) {
        console.error('OCR/AI Error:', err.message);
        res.status(500).json({ msg: 'Failed to scan bill', error: err.message });
    }
});

router.post('/categorize', auth, async (req, res) => {
    const { description, amount, title } = req.body;

    try {
        const ai = getAiClient();

        if (!ai.isConfigured) {
            // Rule based basic categorization
            const lower = `${title || ''} ${description || ''}`.toLowerCase();
            let cat = 'Other';
            if (/food|swiggy|zomato|dinner|lunch|grocery|restaurant|snack|coffee/i.test(lower)) cat = 'Food';
            else if (/uber|ola|metro|petrol|fuel|bus|train|taxi|flight|auto/i.test(lower)) cat = 'Transport';
            else if (/wifi|electricity|water|bill|rent|recharge|mobile|broadband/i.test(lower)) cat = 'Utilities';
            else if (/movie|netflix|spotify|game|cinema|party|club/i.test(lower)) cat = 'Entertainment';
            else if (/amazon|flipkart|myntra|clothes|shoes|shopping/i.test(lower)) cat = 'Shopping';
            else if (/doctor|medicine|hospital|pharmacy|clinic|gym/i.test(lower)) cat = 'Health';
            else if (/school|college|course|book|tuition|udemy/i.test(lower)) cat = 'Education';
            return res.json({ category: cat, isFallback: true });
        }

        const prompt = `
      Based on the following expense details, suggest a category from this list: [Food, Transport, Utilities, Entertainment, Health, Shopping, Travel, Education, Other].
      Return ONLY the category name.
      
      Expense: ${title}
      Description: ${description}
      Amount: ${amount}
    `;

        const response = await ai.client.chat.completions.create({
            model: ai.model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 10,
            temperature: 0.3,
        });

        const suggestedCategory = response.choices[0].message.content.trim();
        res.json({ category: suggestedCategory });
    } catch (err) {
        console.error('AI Categorization Error:', err.message);
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

        const { lang = 'English' } = req.query;
        const ai = getAiClient();

        if (ai.isConfigured) {
            try {
                const expenseSummary = expenses.slice(-30).map(e => `${e.date ? new Date(e.date).toISOString().split('T')[0] : ''}: ${e.title} ($${e.amount}) - ${e.category}`).join('\n');

                const prompt = `
          Analyze the following expense history and provide 3 short, actionable bullet points on spending habits and 1 saving tip.
          Keep it friendly and concise.
          VERY IMPORTANT: The entire response MUST be in ${lang}.

          ${expenseSummary}
        `;

                const response = await ai.client.chat.completions.create({
                    model: ai.model,
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 600,
                    temperature: 0.7,
                });

                return res.json({ insight: response.choices[0].message.content });
            } catch (aiErr) {
                console.warn('AI API call failed, using intelligent rule-based insights:', aiErr.message);
            }
        }

        // Return rich rule-based insights if AI service is not configured or fails
        const fallbackInsight = generateRuleBasedInsights(expenses, lang);
        res.json({
            insight: fallbackInsight,
            isFallback: true
        });

    } catch (err) {
        console.error('AI Insights Error:', err.message);
        res.json({
            insight: "Keep tracking your expenses regularly to gain deeper insights into your financial habits.",
            isFallback: true
        });
    }
});

// @route   GET api/ai/forecast
// @desc    AI-powered budget forecast based on spending velocity
router.get('/forecast', auth, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysPassed = Math.max(1, now.getDate());
        const daysLeft = Math.max(0, daysInMonth - daysPassed);

        if (expenses.length === 0) {
            return res.json({ 
                forecast: 'No expenses recorded yet. Add expenses to generate your budget forecast.', 
                totalSpentThisMonth: 0,
                projectedTotal: 0,
                daysPassed,
                daysInMonth,
                daysLeft,
                dailyRate: 0,
                categoryBreakdown: {}
            });
        }

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

        // Find highest risk category
        const sortedCats = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
        const highestCategory = sortedCats[0] ? sortedCats[0][0] : 'General';
        const highestCategoryAmt = sortedCats[0] ? sortedCats[0][1] : 0;

        let forecastText = `• Forecast: At your current pace of ₹${dailyRate.toFixed(0)}/day, your estimated month-end spending is ₹${projectedTotal.toFixed(2)}.\n• Highest Risk: ${highestCategory} (${sortedCats[0] && totalSpentThisMonth > 0 ? Math.round((highestCategoryAmt / totalSpentThisMonth) * 100) : 0}% of monthly spend).\n• Action Tip: Setting a daily spending cap can help you stay below your target.`;

        const ai = getAiClient();
        if (ai.isConfigured && thisMonthExpenses.length > 0) {
            try {
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

                const response = await ai.client.chat.completions.create({
                    model: ai.model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 300,
                    temperature: 0.6,
                });

                if (response.choices && response.choices[0]?.message?.content) {
                    forecastText = response.choices[0].message.content.trim();
                }
            } catch (aiErr) {
                console.warn('AI Forecast API error, falling back to computed forecast:', aiErr.message);
            }
        }

        // Always return 200 with full calculated data even if AI API is missing
        res.json({
            forecast: forecastText,
            totalSpentThisMonth,
            projectedTotal,
            daysPassed,
            daysInMonth,
            daysLeft,
            dailyRate,
            categoryBreakdown: categoryMap,
        });
    } catch (err) {
        console.error('Forecast calculation Error:', err.message);
        res.status(200).json({
            forecast: 'Unable to calculate forecast at this moment.',
            totalSpentThisMonth: 0,
            projectedTotal: 0,
            daysPassed: 1,
            daysInMonth: 30,
            daysLeft: 29,
            dailyRate: 0,
            categoryBreakdown: {},
            error: err.message
        });
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
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const ai = getAiClient();
        if (ai.isConfigured) {
            const prompt = `
Extract ALL individual line items from this bill/receipt text. 
For each item return an object with: { "title": string, "amount": number, "category": one of [Food, Transport, Utilities, Entertainment, Health, Shopping, Travel, Education, Other] }
Return ONLY a valid JSON array. No markdown, no explanation, no code fences.

Bill text:
${text}`;

            const response = await ai.client.chat.completions.create({
                model: ai.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                temperature: 0.2,
            });

            let rawContent = response.choices[0].message.content.trim();
            const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) rawContent = jsonMatch[0];
            const items = JSON.parse(rawContent);
            return res.json({ items, rawText: text });
        }

        // Rule-based line item splitting if AI is unavailable
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const fallbackItems = [];
        for (const line of lines) {
            const match = line.match(/^(.+?)\s+([0-9]+(?:\.[0-9]{2})?)$/);
            if (match && parseFloat(match[2]) > 0) {
                fallbackItems.push({
                    title: match[1].trim(),
                    amount: parseFloat(match[2]),
                    category: 'Other'
                });
            }
        }
        res.json({ items: fallbackItems.length > 0 ? fallbackItems : [{ title: 'Scanned Item', amount: 0, category: 'Other' }], rawText: text });
    } catch (err) {
        console.error('Bill Split Error:', err.message);
        res.status(500).json({ msg: 'Failed to split bill', error: err.message });
    }
});

module.exports = router;
