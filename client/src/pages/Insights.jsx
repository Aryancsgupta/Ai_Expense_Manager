import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Lightbulb, Sparkles, Globe } from 'lucide-react';

const Insights = () => {
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('English');

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
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/ai/insights?lang=${lang}`, {
                headers: { 'x-auth-token': token },
            });
            setInsight(res.data.insight);
        } catch (err) {
            setInsight('Could not generate insights at this time.');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchInsight(language);
    }, [language, fetchInsight]);

    return (
        <div className="max-w-4xl mx-auto px-6 pt-12 animate-fade-in">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500">AI Financial Insights</h1>
                <p className="text-text-secondary text-lg">Personalized analysis of your spending habits powered by AI.</p>
            </div>

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
