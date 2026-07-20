const Expense = require('../models/Expense');

const processRecurringExpenses = async (userId = null, timezone = 'Asia/Kolkata') => {
    try {
        const now = new Date();
        const nowLocalStr = now.toLocaleDateString('en-US', { timeZone: timezone });
        const nowLocal = new Date(nowLocalStr);
        
        const query = { isRecurring: true };
        if (userId) {
            query.user = userId;
        }
        const recurringExpenses = await Expense.find(query);

        for (const expense of recurringExpenses) {
            let nextDate = expense.lastGeneratedDate ? new Date(expense.lastGeneratedDate) : new Date(expense.date);
            const nextDateLocalStr = nextDate.toLocaleDateString('en-US', { timeZone: timezone });
            let nextDateLocal = new Date(nextDateLocalStr);
            
            let updated = false;
            while (true) {
                if (expense.frequency === 'daily') nextDateLocal.setDate(nextDateLocal.getDate() + 1);
                else if (expense.frequency === 'weekly') nextDateLocal.setDate(nextDateLocal.getDate() + 7);
                else if (expense.frequency === 'monthly') nextDateLocal.setMonth(nextDateLocal.getMonth() + 1);
                else if (expense.frequency === 'yearly') nextDateLocal.setFullYear(nextDateLocal.getFullYear() + 1);
                else break;

                if (nextDateLocal > nowLocal) break;

                // Create new expense
                const newExpense = new Expense({
                    user: expense.user,
                    title: expense.title,
                    amount: expense.amount,
                    category: expense.category,
                    description: expense.description,
                    date: new Date(nextDateLocal),
                    isRecurring: false, // Child expenses are not recurring themselves
                    currency: expense.currency,
                    originalAmount: expense.originalAmount
                });

                await newExpense.save();
                expense.lastGeneratedDate = new Date(nextDateLocal);
                updated = true;
            }
            if (updated) {
                await expense.save();
            }
        }
        console.log(`Recurring expenses processed${userId ? ` for user ${userId}` : ''}`);
    } catch (err) {
        console.error('Error processing recurring expenses:', err.message);
    }
};

module.exports = processRecurringExpenses;
