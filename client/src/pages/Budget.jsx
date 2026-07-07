import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Target, AlertCircle, Pencil, Trash2, X, Check } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import API_URL from '../utils/api';

const Budget = () => {
    const [budgets, setBudgets] = useState([]);
    const [formData, setFormData] = useState({
        category: '',
        amount: '',
    });
    const [loading, setLoading] = useState(false);

    // Edit state
    const [editingBudget, setEditingBudget] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editLoading, setEditLoading] = useState(false);

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
        if (parseFloat(formData.amount) <= 0) {
            alert('Budget amount must be greater than 0.');
            return;
        }
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

    const openEditModal = (budget) => {
        setEditingBudget(budget);
        setEditAmount(budget.amount);
    };

    const closeEditModal = () => {
        setEditingBudget(null);
        setEditAmount('');
    };

    const onEditSubmit = async (e) => {
        e.preventDefault();
        if (parseFloat(editAmount) <= 0) {
            alert('Budget amount must be greater than 0.');
            return;
        }
        setEditLoading(true);
        try {
            await axios.put(`${API_URL}/api/budget/${editingBudget._id}`, { amount: editAmount }, {
                headers: { 'x-auth-token': token }
            });
            closeEditModal();
            fetchBudgets();
        } catch (err) {
            console.error(err);
            alert('Failed to update budget');
        }
        setEditLoading(false);
    };

    const deleteBudget = async (id) => {
        if (!confirm('Are you sure you want to delete this budget?')) return;
        try {
            await axios.delete(`${API_URL}/api/budget/${id}`, {
                headers: { 'x-auth-token': token }
            });
            fetchBudgets();
        } catch (err) {
            console.error(err);
            alert('Failed to delete budget');
        }
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
                            <input type="number" name="amount" value={formData.amount} onChange={onChange} required placeholder="0.00" min="0.01" step="0.01" className="input-field" />
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
                                    <div key={budget._id} className="space-y-2 group">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-lg font-bold">{budget.category}</span>
                                                <div className="text-sm text-text-secondary">
                                                    {currencySymbol}{budget.spent.toFixed(2)} of {currencySymbol}{budget.amount.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`text-sm font-bold ${isOver ? 'text-red-400' : 'text-accent'}`}>
                                                    {percent.toFixed(0)}%
                                                </div>
                                                {/* Edit & Delete buttons */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(budget)}
                                                        className="p-1.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-colors"
                                                        title="Edit budget"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteBudget(budget._id)}
                                                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-400 transition-colors"
                                                        title="Delete budget"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
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

            {/* Edit Budget Modal */}
            {editingBudget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeEditModal}
                    />
                    {/* Modal */}
                    <div className="relative card w-full max-w-sm shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <div className="bg-accent/10 p-2 rounded-lg text-accent"><Pencil size={18} /></div>
                                Edit Budget
                            </h3>
                            <button
                                onClick={closeEditModal}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={onEditSubmit} className="flex flex-col gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-text-secondary">Category</p>
                                <p className="text-lg font-bold">{editingBudget.category}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">
                                    New Amount ({currencySymbol})
                                </label>
                                <input
                                    type="number"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    required
                                    min="0.01"
                                    step="0.01"
                                    className="input-field"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                                    disabled={editLoading}
                                >
                                    {editLoading ? 'Saving...' : <><Check size={16} /> Save</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Budget;
