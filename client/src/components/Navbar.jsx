import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, User, LayoutDashboard, Wallet, TrendingUp } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const token = localStorage.getItem('token');

    const user = (() => {
        try {
            const u = localStorage.getItem('user');
            return u ? JSON.parse(u) : null;
        } catch (e) {
            return null;
        }
    })();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        setIsMobileMenuOpen(false);
    };

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { path: '/expenses', label: 'Expenses', icon: <Wallet size={18} /> },
        { path: '/insights', label: 'Insights', icon: <TrendingUp size={18} /> },
    ];

    return (
        <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                <Link to="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent to-indigo-400 tracking-tight">
                    AI Expense Manager
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    {token ? (
                        <>
                            <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-white/5">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive(link.path)
                                            ? 'text-white bg-slate-700 shadow-lg'
                                            : 'text-text-secondary hover:text-white hover:bg-slate-700/50'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>

                            {user?.role === 'admin' && (
                                <Link to="/admin" className="text-red-500 font-bold text-sm px-3 py-1 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                                    Admin
                                </Link>
                            )}

                            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                                <div className="flex items-center gap-3 text-sm font-medium">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white shadow-lg shadow-accent/20">
                                        <User size={16} />
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-white">{user?.name}</span>
                                        <span className="text-xs text-text-secondary mt-1">{user?.currency}</span>
                                    </div>
                                </div>

                                <button onClick={handleLogout} className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Logout">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-4">
                            <Link to="/login" className="btn btn-secondary py-2 px-6 text-sm">Login</Link>
                            <Link to="/register" className="btn btn-primary py-2 px-6 text-sm">Register</Link>
                        </div>
                    )}
                </div>

                <button className="md:hidden text-text-primary p-2 hover:bg-white/5 rounded-lg transition-colors" onClick={toggleMenu}>
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-slate-900 border-b border-white/10 overflow-hidden shadow-2xl"
                    >
                        <div className="p-6 flex flex-col gap-4">
                            {token ? (
                                <>
                                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{user?.name}</div>
                                            <div className="text-sm text-text-secondary">{user?.email}</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {navLinks.map((link) => (
                                            <Link
                                                key={link.path}
                                                to={link.path}
                                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive(link.path)
                                                    ? 'bg-accent/10 text-accent border border-accent/20'
                                                    : 'text-text-secondary hover:bg-white/5 hover:text-white'
                                                    }`}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                {link.icon}
                                                <span className="font-medium">{link.label}</span>
                                            </Link>
                                        ))}
                                    </div>

                                    {user?.role === 'admin' && (
                                        <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-center p-3 text-red-400 bg-red-500/10 rounded-xl font-bold">
                                            Access Admin Panel
                                        </Link>
                                    )}

                                    <button onClick={handleLogout} className="mt-2 w-full btn btn-secondary justify-center text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40">
                                        <LogOut size={18} />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Link to="/login" className="btn btn-secondary w-full justify-center" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                                    <Link to="/register" className="btn btn-primary w-full justify-center" onClick={() => setIsMobileMenuOpen(false)}>Create Account</Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
