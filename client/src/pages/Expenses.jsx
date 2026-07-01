import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Trash2, Sparkles, Plus, Calendar, DollarSign, Tag, FileText, Download, Search, Filter, RefreshCw, Scan } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import { CURRENCIES } from '../utils/currencies';
import API_URL from '../utils/api';

const Expenses = () => {
    const user = (() => {
        try {
            const u = localStorage.getItem('user');
            return u ? JSON.parse(u) : null;
        } catch (e) {
            return null;
        }
    })();

    const [expenses, setExpenses] = useState([]);
    // Helper function to format current time as HH:MM
    const getCurrentTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: getCurrentTime(),
        isRecurring: false,
        frequency: 'none',
        currency: user?.currency || 'USD'
    });
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        startDate: '',
        endDate: ''
    });
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);

    const token = localStorage.getItem('token');
    const currencySymbol = getCurrencySymbol(user?.currency || 'USD');

    const fetchExpenses = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.category) params.append('category', filters.category);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const res = await axios.get(`${API_URL}/api/expenses?${params.toString()}`, {
                headers: { 'x-auth-token': token },
            });
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [filters, token]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const onChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const exportToCSV = () => {
        window.open(`${API_URL}/api/expenses/export?token=${token}`, '_blank');
    };

    const scanBill = async () => {
        if (!bill) return alert('Please select a bill image first');
        setScanLoading(true);
        const data = new FormData();
        data.append('bill', bill);
        try {
            const res = await axios.post(`${API_URL}/api/ai/scan`, data, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
            });
            setFormData({
                ...formData,
                title: res.data.title || '',
                amount: res.data.amount || '',
                category: res.data.category || '',
                date: res.data.date || formData.date
            });
            alert('Bill scanned successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to scan bill');
        }
        setScanLoading(false);
    };

    const suggestCategory = async () => {
        if (!formData.title && !formData.description) return alert('Enter title or description first');
        setAiLoading(true);
        try {
            const res = await axios.post(
                `${API_URL}/api/ai/categorize`,
                {
                    description: formData.description || formData.title,
                    title: formData.title,
                    amount: formData.amount
                },
                { headers: { 'x-auth-token': token } }
            );
            if (res.data.category) {
                setFormData(prev => ({ ...prev, category: res.data.category }));
            }
        } catch (err) {
            console.error('AI Suggestion Error:', err);
        }
        setAiLoading(false);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        // Combine date and time into a single Date string
        const combinedDate = new Date(`${formData.date}T${formData.time}`);
        Object.keys(formData).forEach(key => {
            if (key === 'date') {
                data.append(key, combinedDate.toISOString());
            } else if (key !== 'time') { // Skip time field since we combined it
                data.append(key, formData[key]);
            }
        });
        if (bill) data.append('bill', bill);

        try {
            await axios.post(`${API_URL}/api/expenses`, data, {
                headers: { 'x-auth-token': token },
            });
            setFormData({
                title: '',
                amount: '',
                category: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                time: getCurrentTime(),
                isRecurring: false,
                frequency: 'none',
                currency: user?.currency || 'USD'
            });
            setBill(null);
            fetchExpenses();
        } catch (err) {
            console.error('Error adding expense:', err);
            const msg = err.response?.data?.msg || err.response?.data?.error || err.message;
            alert(`Failed to add expense: ${msg}`);
        }
        setLoading(false);
    };

    const deleteExpense = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await axios.delete(`${API_URL}/api/expenses/${id}`, {
                headers: { 'x-auth-token': token },
            });
            fetchExpenses();
        } catch (err) {
            console.error(err);
        }
    };

    const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Travel', 'Education', 'Other'];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 animate-fade-in pt-8 w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-accent to-pink-500">Expenses</h1>
                <button onClick={exportToCSV} className="btn btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Download size={18} /> Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="card h-fit lg:col-span-1 overflow-hidden">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <div className="bg-accent/10 p-2 rounded-lg text-accent"><Plus size={20} /></div>
                        Add New
                    </h3>
                    <form onSubmit={onSubmit} className="flex flex-col gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Title</label>
                            <input type="text" name="title" value={formData.title} onChange={onChange} required placeholder="e.g. Starbucks" className="input-field" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Amount</label>
                                <input type="number" name="amount" value={formData.amount} onChange={onChange} required placeholder="0.00" min="0.01" step="0.01" className="input-field" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Currency</label>
                                <select name="currency" value={formData.currency} onChange={onChange} className="input-field">
                                    {CURRENCIES.map((curr) => (
                                        <option key={curr.code} value={curr.code}>{curr.code} ({getCurrencySymbol(curr.code)})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Date</label>
                                <input type="date" name="date" value={formData.date} onChange={onChange} required className="input-field" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Time</label>
                                <input type="time" name="time" value={formData.time} onChange={onChange} required className="input-field" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex gap-2 items-end">
                                <div className="w-full">
                                    <label className="text-sm font-medium text-text-secondary">Category</label>
                                    <select name="category" value={formData.category} onChange={onChange} required className="input-field">
                                        <option value="">Select Category</option>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <button type="button" onClick={suggestCategory} className="btn btn-secondary h-[52px] flex-shrink-0" title="AI Suggest Category" disabled={aiLoading}>
                                    <Sparkles size={20} className={aiLoading ? 'animate-spin' : 'text-accent'} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 py-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="isRecurring" checked={formData.isRecurring} onChange={onChange} className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent focus:ring-accent" />
                                <span className="text-sm font-medium text-text-secondary flex items-center gap-1"><RefreshCw size={14} /> Recurring?</span>
                            </label>
                            {formData.isRecurring && (
                                <select name="frequency" value={formData.frequency} onChange={onChange} className="input-field py-1 px-2 h-auto text-xs w-full sm:w-32">
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Attachment / OCR Scan</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input type="file" accept="image/*" onChange={(e) => setBill(e.target.files[0])} className="input-field text-xs w-full" />
                                <button type="button" onClick={scanBill} className="btn btn-secondary w-full sm:w-auto justify-center" title="Scan with AI OCR" disabled={scanLoading || !bill}>
                                    <Scan size={20} className={scanLoading ? 'animate-spin text-accent' : 'text-accent'} />
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Expense'}
                        </button>
                    </form>
                </div>

                <div className="card lg:col-span-2 overflow-hidden">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4 w-full">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                                <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search expenses..." className="input-field pl-10 w-full" />
                            </div>
                            <div className="flex flex-wrap gap-2 w-full">
                                <select name="category" value={filters.category} onChange={handleFilterChange} className="input-field py-2 px-3 h-auto text-sm flex-1 min-w-[120px]">
                                    <option value="">All Categories</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="input-field py-2 px-3 h-auto text-sm flex-1 min-w-[120px]" placeholder="From" />
                                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="input-field py-2 px-3 h-auto text-sm flex-1 min-w-[120px]" placeholder="To" />
                            </div>
                        </div>

                        <div className="table-container overflow-x-auto">
                            <table className="glass-table min-w-[600px]">
                                <thead>
                                    <tr>
                                        <th className="whitespace-nowrap">Date</th>
                                        <th className="whitespace-nowrap">Title</th>
                                        <th className="whitespace-nowrap">Category</th>
                                        <th className="whitespace-nowrap">Amount</th>
                                        <th className="whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(exp => (
                                        <tr key={exp._id}>
                                            <td className="text-text-secondary text-sm whitespace-nowrap">{new Date(exp.date).toLocaleDateString()}</td>
                                            <td>
                                                <div className="font-semibold text-white flex items-center gap-2">
                                                    {exp.title}
                                                    {exp.isRecurring && <RefreshCw size={12} className="text-accent flex-shrink-0" />}
                                                </div>
                                                {exp.description && <div className="text-xs text-text-secondary mt-0.5 truncate max-w-[120px] sm:max-w-[150px]">{exp.description}</div>}
                                            </td>
                                            <td className="whitespace-nowrap"><span className="badge badge-accent">{exp.category}</span></td>
                                            <td className="font-bold text-white whitespace-nowrap">-{getCurrencySymbol(exp.currency || 'USD')}{exp.amount.toFixed(2)}</td>
                                            <td className="whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {exp.billUrl && <a href={`${API_URL}${exp.billUrl}`} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white/5 rounded-lg text-text-secondary transition-colors"><FileText size={18} /></a>}
                                                    <button onClick={() => deleteExpense(exp._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
