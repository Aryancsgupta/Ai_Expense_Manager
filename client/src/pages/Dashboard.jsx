import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, CreditCard, Activity } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';

const Dashboard = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    const user = (() => {
        try {
            const u = localStorage.getItem('user');
            return u ? JSON.parse(u) : null;
        } catch (e) {
            return null;
        }
    })();
    const currencySymbol = getCurrencySymbol(user?.currency || 'USD');

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/expenses', {
                    headers: { 'x-auth-token': token },
                });
                setExpenses(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchExpenses();
    }, []);

    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const categoryData = expenses.reduce((acc, curr) => {
        const existing = acc.find(item => item.name === curr.category);
        if (existing) {
            existing.value += curr.amount;
        } else {
            acc.push({ name: curr.category, value: curr.amount });
        }
        return acc;
    }, []);

    const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];

    if (loading) return (
        <div className="min-h-[60vh] flex justify-center items-center">
            <Activity className="animate-spin text-accent" size={48} />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 pb-12 animate-fade-in pt-8">
            <h1 className="text-4xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-text-secondary text-sm font-medium mb-1">Total Spending</h3>
                            <div className="text-4xl font-extrabold text-white tracking-tight">
                                {currencySymbol}{totalSpent.toFixed(2)}
                            </div>
                        </div>
                        <div className="p-3 bg-accent/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Wallet size={24} className="text-accent" />
                        </div>
                    </div>
                </div>

                <div className="card flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-text-secondary text-sm font-medium mb-1">Transactions</h3>
                            <div className="text-4xl font-extrabold text-white tracking-tight">
                                {expenses.length}
                            </div>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <CreditCard size={24} className="text-purple-400" />
                        </div>
                    </div>
                </div>

                <div className="card flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-text-secondary text-sm font-medium mb-1">Top Category</h3>
                            <div className="text-2xl font-bold text-accent mt-2 truncate">
                                {categoryData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
                            </div>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp size={24} className="text-emerald-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card min-h-[450px] flex flex-col">
                    <h3 className="text-xl font-bold mb-6">Spending by Category</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `${currencySymbol}${value}`}
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        borderColor: '#334155',
                                        color: '#f8fafc',
                                        borderRadius: '12px',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 flex-wrap mt-6">
                        {categoryData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-text-secondary bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Recent Transactions</h3>
                        <Link to="/expenses" className="text-sm text-accent hover:text-accent-hover font-medium">View All</Link>
                    </div>
                    <div className="flex flex-col gap-3">
                        {expenses.slice(0, 5).map(exp => (
                            <div key={exp._id} className="flex justify-between items-center p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-accent font-bold text-lg group-hover:scale-105 transition-transform">
                                        {exp.category[0]}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white">{exp.title}</div>
                                        <div className="text-xs text-text-secondary mt-0.5">{new Date(exp.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="font-bold text-white text-lg">
                                    -{currencySymbol}{exp.amount.toFixed(2)}
                                </div>
                            </div>
                        ))}
                        {expenses.length === 0 && <p className="text-text-secondary text-center py-10 italic">No transactions yet. Start tracking to see data here!</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
