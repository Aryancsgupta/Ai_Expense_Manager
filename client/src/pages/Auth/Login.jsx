import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ArrowRight } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Login Failed');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="card w-full max-w-md animate-fade-in relative overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/20 blur-[60px] rounded-full"></div>

                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-accent/10 rounded-2xl mb-4 text-accent">
                        <LogIn size={32} />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Welcome Back</h1>
                    <p className="text-text-secondary mt-2">Sign in to manage your expenses</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary ml-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            required
                            placeholder="Enter your email"
                            className="input-field"
                        />
                    </div>
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

                    <button type="submit" className="btn btn-primary w-full mt-4 group">
                        Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <p className="text-center mt-6 text-text-secondary text-sm">
                    Don't have an account? <Link to="/register" className="text-accent hover:text-accent-hover font-semibold transition-colors">Create one now</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
