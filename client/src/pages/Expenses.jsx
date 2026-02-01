import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Sparkles, Plus, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import API_URL from '../utils/api';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    const token = localStorage.getItem('token');

    const user = (() => {
        try {
            const u = localStorage.getItem('user');
            return u ? JSON.parse(u) : null;
        } catch (e) {
            return null;
        }
    })();
    const currencySymbol = getCurrencySymbol(user?.currency || 'USD');

    const fetchExpenses = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/expenses`, {
                headers: { 'x-auth-token': token },
            });
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

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
                if (res.data.isFallback) {
                    console.warn('AI Suggestion using fallback:', res.data.error);
                }
            }
        } catch (err) {
            console.error('AI Suggestion Error:', err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                alert('Session expired or invalid. Please login again.');
                window.location.href = '/login';
                return;
            }

            const errorMessage = err.response?.data?.msg || err.response?.data?.error || err.message;
            alert(`AI Suggestion failed: ${errorMessage}`);
        }
        setAiLoading(false);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('amount', formData.amount);
        data.append('category', formData.category);
        data.append('description', formData.description);
        data.append('date', formData.date);
        if (bill) data.append('bill', bill);

        try {
            await axios.post(`${API_URL}/api/expenses`, data, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                },
            });
            setFormData({
                title: '',
                amount: '',
                category: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
            });
            setBill(null);
            const fileInput = document.getElementById('bill-input');
            if (fileInput) fileInput.value = '';

            fetchExpenses();
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            } else {
                alert('Failed to add expense');
            }
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
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 pb-12 animate-fade-in pt-8">
            <h1 className="text-4xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">Expenses</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="card h-fit lg:col-span-1">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <div className="bg-accent/10 p-2 rounded-lg text-accent"><Plus size={20} /></div>
                        Add New
                    </h3>
                    <form onSubmit={onSubmit} className="flex flex-col gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                <FileText size={14} /> Title
                            </label>
                            <input type="text" name="title" value={formData.title} onChange={onChange} required placeholder="e.g. Starbucks" className="input-field" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                <DollarSign size={14} /> Amount ({currencySymbol})
                            </label>
                            <input type="number" name="amount" value={formData.amount} onChange={onChange} required placeholder="0.00" className="input-field" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                <Calendar size={14} /> Date
                            </label>
                            <input type="date" name="date" value={formData.date} onChange={onChange} required className="input-field" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Description</label>
                            <textarea name="description" value={formData.description} onChange={onChange} rows="2" placeholder="Optional details..." className="input-field resize-none"></textarea>
                        </div>

                        <div className="space-y-2">
                            <div className="flex gap-2 items-end">
                                <div className="w-full">
                                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2 mb-2">
                                        <Tag size={14} /> Category
                                    </label>
                                    <input type="text" name="category" value={formData.category} onChange={onChange} required placeholder="Select or type..." className="input-field" />
                                </div>
                                <button type="button" onClick={suggestCategory} className="btn btn-secondary !px-4 !py-3.5 h-[52px]" title="Auto Categorize with AI" disabled={aiLoading}>
                                    {aiLoading ? <span className="animate-spin">...</span> : <Sparkles size={20} className="text-accent" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                <FileText size={14} /> Attachment (Bill/Receipt)
                            </label>
                            <input
                                id="bill-input"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setBill(e.target.files[0])}
                                className="input-field file:bg-accent/10 file:text-accent file:border-none file:rounded-lg file:px-3 file:py-1 file:mr-4 cursor-pointer"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                            {loading ? <span className="animate-spin text-center w-full block">●</span> : 'Add Expense'}
                        </button>
                    </form>
                </div>
                <div className="card lg:col-span-2 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">History</h3>
                        <span className="badge badge-accent shadow-none bg-accent/10 border-none">{expenses.length} Records</span>
                    </div>

                    <div className="table-container">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(exp => (
                                    <tr key={exp._id}>
                                        <td className="text-text-secondary text-sm">{new Date(exp.date).toLocaleDateString()}</td>
                                        <td>
                                            <div className="font-semibold text-white">{exp.title}</div>
                                            {exp.description && <div className="text-xs text-text-secondary mt-0.5 max-w-[200px] truncate">{exp.description}</div>}
                                        </td>
                                        <td><span className="badge badge-accent">{exp.category}</span></td>
                                        <td className="font-bold text-white">-{currencySymbol}{exp.amount.toFixed(2)}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {exp.billUrl && (
                                                    <a
                                                        href={`${API_URL}${exp.billUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors border border-transparent"
                                                        title="View Bill"
                                                    >
                                                        <FileText size={16} />
                                                    </a>
                                                )}
                                                <button onClick={() => deleteExpense(exp._id)} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr><td colSpan="5" className="text-center text-text-secondary py-12 italic">No expenses found. Add your first one!</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
