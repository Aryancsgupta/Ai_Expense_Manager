import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Lightbulb, Sparkles, Globe, TrendingUp, AlertTriangle, BarChart2, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import API_URL from '../utils/api';
import { getCurrencySymbol } from '../utils/currency';

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#a78bfa', '#34d399', '#fb923c'];

const Insights = () => {
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('English');

    // Forecast state
    const [forecast, setForecast] = useState(null);
    const [forecastLoading, setForecastLoading] = useState(false);
    const [forecastError, setForecastError] = useState('');

    const token = localStorage.getItem('token');
    const user = (() => {
        try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; } catch { return null; }
    })();
    const currencySymbol = getCurrencySymbol(user?.currency || 'INR');

    const languages = [
        { name: 'English', code: 'English' },
        { name: 'Hindi (हिंदी)', code: 'Hindi' },
        { name: 'Hinglish (Hindi + English)', code: 'Hinglish' },
        { name: 'Spanish (Español)', code: 'Spanish' },
        { name: 'French (Français)', code: 'French' }
    ];

    const fetchInsight = useCallback(async (lang) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/ai/insights?lang=${lang}`, {
                headers: { 'x-auth-token': token },
            });
            setInsight(res.data.insight);
        } catch (err) {
            setInsight('Could not generate insights at this time.');
        }
        setLoading(false);
    }, [token]);

    const fetchForecast = useCallback(async () => {
        setForecastLoading(true);
        setForecastError('');
        try {
            const res = await axios.get(`${API_URL}/api/ai/forecast`, {
                headers: { 'x-auth-token': token },
            });
            setForecast(res.data);
        } catch (err) {
            setForecastError('Could not load forecast. Please try again.');
        }
        setForecastLoading(false);
    }, [token]);

    useEffect(() => {
        fetchInsight(language);
        fetchForecast();
    }, [language, fetchInsight, fetchForecast]);

    const categoryChartData = forecast?.categoryBreakdown
        ? Object.entries(forecast.categoryBreakdown).map(([name, value]) => ({ name, value }))
        : [];

    const velocityPercent = forecast
        ? Math.min((forecast.daysPassed / forecast.daysInMonth) * 100, 100)
        : 0;
    const spendPercent = forecast && forecast.projectedTotal > 0
        ? Math.min((forecast.totalSpentThisMonth / forecast.projectedTotal) * 100, 100)
        : 0;

    return (
        <div className="max-w-5xl mx-auto px-6 pt-12 animate-fade-in pb-12">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500">AI Financial Insights</h1>
                <p className="text-text-secondary text-lg">Personalized analysis of your spending habits powered by AI.</p>
            </div>

            {/* ===== AI FORECAST SECTION ===== */}
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center gap-2">
                    <TrendingUp size={24} className="text-indigo-400" /> Budget Forecast
                </h2>

                {forecastLoading ? (
                    <div className="card text-center py-12">
                        <Sparkles className="animate-spin mb-4 mx-auto text-indigo-400" size={32} />
                        <p className="text-text-secondary animate-pulse">Analyzing spending velocity...</p>
                    </div>
                ) : forecastError ? (
                    <div className="card text-center py-10 text-text-secondary">
                        <AlertTriangle size={36} className="mx-auto mb-2 opacity-40" />
                        <p>{forecastError}</p>
                    </div>
                ) : forecast && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Stat Cards */}
                        <div className="card flex flex-col gap-5">
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                                <p className="text-xs text-text-secondary mb-1 uppercase tracking-wide">Spent This Month</p>
                                <p className="text-2xl font-extrabold text-white">{currencySymbol}{forecast.totalSpentThisMonth?.toFixed(2)}</p>
                                <p className="text-xs text-text-secondary mt-1">{forecast.daysPassed} of {forecast.daysInMonth} days</p>
                                <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${velocityPercent}%` }} />
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                <p className="text-xs text-text-secondary mb-1 uppercase tracking-wide">Projected Total</p>
                                <p className="text-2xl font-extrabold text-amber-400">{currencySymbol}{forecast.projectedTotal?.toFixed(2)}</p>
                                <p className="text-xs text-text-secondary mt-1">at current rate of {currencySymbol}{forecast.dailyRate?.toFixed(0)}/day</p>
                                <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${spendPercent}%` }} />
                                </div>
                            </div>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                <p className="text-xs text-text-secondary mb-1 uppercase tracking-wide">Days Remaining</p>
                                <p className="text-2xl font-extrabold text-emerald-400">{forecast.daysLeft}</p>
                                <p className="text-xs text-text-secondary mt-1">days left in this month</p>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="card flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart2 size={18} className="text-indigo-400" />
                                <h4 className="font-bold text-white">Category Breakdown</h4>
                            </div>
                            {categoryChartData.length > 0 ? (
                                <>
                                    <div className="w-full min-w-0 h-[160px]">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                                            <PieChart>
                                                <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                                                    {categoryChartData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                                    formatter={(value) => [`${currencySymbol}${Number(value).toFixed(2)}`, '']}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                                        {categoryChartData.map((entry, i) => (
                                            <div key={entry.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                                {entry.name}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">No data this month</div>
                            )}
                        </div>

                        {/* AI Forecast Text */}
                        <div className="card flex flex-col gap-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap size={18} className="text-yellow-400" />
                                <h4 className="font-bold text-white">AI Recommendations</h4>
                            </div>
                            {forecast.forecast ? (
                                <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto">
                                    {forecast.forecast}
                                </div>
                            ) : (
                                <p className="text-text-secondary text-sm">{forecast.msg || 'Add more expenses to get predictions.'}</p>
                            )}
                            <button
                                onClick={fetchForecast}
                                disabled={forecastLoading}
                                className="btn btn-secondary text-xs flex items-center justify-center gap-2 mt-auto"
                            >
                                <Sparkles size={14} /> Refresh Forecast
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== EXISTING AI INSIGHTS ===== */}
            <div className="card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-yellow-500/10 rounded-2xl text-yellow-400 border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
                            <Lightbulb size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">Analysis Report</h3>
                            <p className="text-text-secondary text-sm">Generated based on your recent transactions</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-bg-secondary/50 p-2 rounded-xl border border-white/5">
                        <Globe size={18} className="text-yellow-400" />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-transparent text-white border-none outline-none text-sm cursor-pointer pr-4"
                        >
                            {languages.map((lang) => (
                                <option key={lang.code} value={lang.code} className="bg-bg-primary">
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <Sparkles className="animate-spin mb-4 mx-auto text-yellow-400" size={32} />
                        <p className="text-text-secondary animate-pulse">Analyzing in {language}...</p>
                    </div>
                ) : (
                    <div className="prose prose-invert prose-lg max-w-none text-text-primary leading-relaxed whitespace-pre-wrap">
                        {insight}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Insights;
