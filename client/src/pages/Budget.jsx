import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import API_URL from '../utils/api';

const Budget = () => {
    const [budgets, setBudgets] = useState([]);
    const [formData, setFormData] = useState({
        category: '',
        amount: '',
    });
    const [loading, setLoading] = useState(false);

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

    const fetchBudgets = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/budget`, {
                headers: { 'x-auth-token': token },
            });
            setBudgets(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, []);

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/budget`, formData, {
                headers: { 'x-auth-token': token },
            });
            setFormData({ category: '', amount: '' });
            fetchBudgets();
        } catch (err) {
            console.error(err);
            alert('Failed to set budget');
        }
        setLoading(false);
    };

    const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Travel', 'Education', 'Other'];

    return (
        <div className="max-w-7xl mx-auto px-6 pb-12 animate-fade-in pt-8">
            <h1 className="text-4xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">Monthly Budget</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="card h-fit lg:col-span-1">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <div className="bg-accent/10 p-2 rounded-lg text-accent"><Plus size={20} /></div>
                        Set Budget
                    </h3>
                    <form onSubmit={onSubmit} className="flex flex-col gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Category</label>
                            <select name="category" value={formData.category} onChange={onChange} required className="input-field">
                                <option value="">Select Category</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Amount ({currencySymbol})</label>
                            <input type="number" name="amount" value={formData.amount} onChange={onChange} required placeholder="0.00" className="input-field" />
                        </div>
                        <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
                            {loading ? 'Setting...' : 'Set Budget'}
                        </button>
                    </form>
                </div>

                <div className="card lg:col-span-2">
                    <h3 className="text-xl font-bold mb-6">Current Progress</h3>
                    <div className="space-y-6">
                        {budgets.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary">
                                <Target size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No budgets set for this month.</p>
                            </div>
                        ) : (
                            budgets.map(budget => {
                                const percent = Math.min((budget.spent / budget.amount) * 100, 100);
                                const isOver = budget.spent > budget.amount;
                                return (
                                    <div key={budget._id} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-lg font-bold">{budget.category}</span>
                                                <div className="text-sm text-text-secondary">
                                                    {currencySymbol}{budget.spent.toFixed(2)} of {currencySymbol}{budget.amount.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className={`text-sm font-bold ${isOver ? 'text-red-400' : 'text-accent'}`}>
                                                {percent.toFixed(0)}%
                                            </div>
                                        </div>
                                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-accent'}`}
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                        {isOver && (
                                            <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                                                <AlertCircle size={12} /> Budget exceeded!
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Budget;
