export const getCurrencySymbol = (code) => {
    switch (code) {
        case 'INR': return '₹';
        case 'AED': return 'د.إ'; 
        case 'USD': return '$';
        default: return '₹';
    }
};
