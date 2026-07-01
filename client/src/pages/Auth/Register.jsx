import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import API_URL from '../../utils/api';
import { CURRENCIES } from '../../utils/currencies';
import { getCurrencySymbol } from '../../utils/currency';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        currency: 'INR',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const { name, email, password, confirmPassword, currency } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            const res = await axios.post(`${API_URL}/api/auth/register`, {
                name,
                email,
                password,
                currency
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (err) {
            console.error('Registration error:', err);
            const message = err.response?.data?.msg || err.message || 'Registration Failed';
            setError(message);
        }
    };

    return (
        <>
            <Helmet>
                <title>Register | AI Expense Manager</title>
                <meta name="description" content="Create a free AI Expense Manager account to start tracking your expenses, managing budgets, and getting personalized financial insights with AI." />
                <meta name="keywords" content="register, sign up, expense manager, create account, AI finance" />
                <meta property="og:title" content="Register | AI Expense Manager" />
                <meta property="og:description" content="Create a free AI Expense Manager account to start tracking your expenses, managing budgets, and getting personalized financial insights with AI." />
                <meta property="og:type" content="website" />
            </Helmet>
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="card w-full max-w-md animate-fade-in relative overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-accent/20 blur-[60px] rounded-full"></div>
                    <div className="text-center mb-8">
                        <div className="inline-flex p-3 bg-accent/10 rounded-2xl mb-4 text-accent">
                            <UserPlus size={32} />
                        </div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Create Account</h1>
                        <p className="text-text-secondary mt-2">Join us to control your finances</p>
                    </div>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary ml-1">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={onChange}
                                required
                                placeholder="Name"
                                className="input-field"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary ml-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                required
                                placeholder="email@example.com"
                                className="input-field"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary ml-1">Preferred Currency</label>
                            <select name="currency" value={currency} onChange={onChange} className="input-field appearance-none">
                                {CURRENCIES.map((curr) => (
                                    <option key={curr.code} value={curr.code}>{curr.code} ({getCurrencySymbol(curr.code)}) - {curr.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary ml-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    required
                                    placeholder="••••••••"
                                    className="input-field"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary ml-1">Confirm</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={onChange}
                                    required
                                    placeholder="••••••••"
                                    className="input-field"
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary w-full mt-4 group">
                            Sign Up <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                    <p className="text-center mt-6 text-text-secondary text-sm">
                        Already have an account? <Link to="/login" className="text-accent hover:text-accent-hover font-semibold transition-colors">Login</Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default Register;
