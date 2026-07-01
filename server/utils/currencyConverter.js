const axios = require('axios');
const User = require('../models/User');
const Expense = require('../models/Expense');

const getExchangeRates = async (baseCurrency) => {
    try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        return response.data.rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error.message);
        return null;
    }
};

const convertExpensesToNativeCurrency = async () => {
    console.log('Starting currency conversion job at', new Date().toISOString());
    
    try {
        const users = await User.find({});
        
        for (const user of users) {
            const nativeCurrency = user.currency;
            
            // Get exchange rates with base as native currency
            const rates = await getExchangeRates(nativeCurrency);
            if (!rates) continue;

            // Find expenses of this user that are not in native currency and haven't been converted yet (or need update)
            const expenses = await Expense.find({
                user: user._id,
                currency: { $ne: nativeCurrency }
            });

            for (const expense of expenses) {
                // If originalAmount is not set, set it to current amount
                if (!expense.originalAmount) {
                    expense.originalAmount = expense.amount;
                }

                // Convert from expense.currency to nativeCurrency
                const fromCurrency = expense.currency;
                const toCurrency = nativeCurrency;
                
                // Since rates are base: nativeCurrency, we need to calculate inverse
                // rate = 1 / rates[fromCurrency] (because rates[fromCurrency] is how much 1 nativeCurrency is worth in fromCurrency)
                const rate = 1 / rates[fromCurrency];
                const convertedAmount = expense.originalAmount * rate;
                
                // Update expense
                expense.amount = parseFloat(convertedAmount.toFixed(2));
                expense.currency = nativeCurrency;
                
                await expense.save();
                console.log(`Converted expense ${expense._id} for user ${user._id} from ${fromCurrency} to ${toCurrency}: ${expense.originalAmount} -> ${expense.amount}`);
            }
        }
        
        console.log('Currency conversion job completed at', new Date().toISOString());
    } catch (error) {
        console.error('Error in currency conversion job:', error.message);
    }
};

module.exports = {
    convertExpensesToNativeCurrency
};