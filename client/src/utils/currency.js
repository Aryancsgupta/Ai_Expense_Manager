export const getCurrencySymbol = (code) => {
    switch (code) {
        case 'INR': return '₹';
        case 'AED': return 'د.إ'; // Dirham
        case 'USD': return '$';
        default: return '₹';
    }
};
