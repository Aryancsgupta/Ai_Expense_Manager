const Expense = require('../models/Expense');

const processRecurringExpenses = async () => {
    try {
        const now = new Date();
        // Set time to midnight to avoid timezone issues
        now.setHours(0, 0, 0, 0);
        
        const recurringExpenses = await Expense.find({ isRecurring: true });

        for (const expense of recurringExpenses) {
            let nextDate = expense.lastGeneratedDate ? new Date(expense.lastGeneratedDate) : new Date(expense.date);
            nextDate.setHours(0, 0, 0, 0);
            
            while (true) {
                if (expense.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
                else if (expense.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                else if (expense.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                else if (expense.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
                else break;

                if (nextDate > now) break;

                // Create new expense
                const newExpense = new Expense({
                    user: expense.user,
                    title: expense.title,
                    amount: expense.amount,
                    category: expense.category,
                    description: expense.description,
                    date: new Date(nextDate),
                    isRecurring: false, // Child expenses are not recurring themselves
                    currency: expense.currency,
                    originalAmount: expense.originalAmount
                });

                await newExpense.save();
                expense.lastGeneratedDate = new Date(nextDate);
                await expense.save();
            }
        }
        console.log('Recurring expenses processed');
    } catch (err) {
        console.error('Error processing recurring expenses:', err.message);
    }
};

module.exports = processRecurringExpenses;
