import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, User, LayoutDashboard, Wallet, TrendingUp, Target, MessageSquare, Lock, Palette, Check } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import ChangePasswordModal from './ChangePasswordModal';
import { themes, applyTheme, initTheme } from '../utils/themes';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('default');
    const themeDropdownRef = useRef(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        const activeTheme = initTheme();
        setCurrentTheme(activeTheme);

        const handleClickOutside = (event) => {
            if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
                setIsThemeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleThemeChange = (themeId) => {
        applyTheme(themeId);
        setCurrentTheme(themeId);
        setIsThemeDropdownOpen(false);
    };

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
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { path: '/expenses', label: 'Expenses', icon: <Wallet size={18} /> },
        { path: '/insights', label: 'Insights', icon: <TrendingUp size={18} /> },
        { path: '/budget', label: 'Budget', icon: <Target size={18} /> },
    ];

    return (
        <>
            <nav className="fixed top-0 w-full z-50 bg-bg-header backdrop-blur-md border-b border-glass-border transition-colors duration-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent to-pink-500 tracking-tight">
                        AI Expense Manager
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all duration-300"
                            title="Refresh Page"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                        </button>

                        {/* Theme Switcher Button */}
                        <div className="relative" ref={themeDropdownRef}>
                            <button
                                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                                className="flex items-center gap-2 p-2 px-3 rounded-xl text-text-secondary hover:text-white hover:bg-white/10 border border-glass-border transition-all text-xs font-semibold"
                                title="Change Theme"
                            >
                                <Palette size={16} className="text-accent" />
                                <span className="hidden sm:inline">Theme</span>
                            </button>

                            <AnimatePresence>
                                {isThemeDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute left-0 sm:left-0 max-w-[calc(100vw-2rem)] w-60 sm:w-64 mt-2 bg-bg-card border border-glass-border rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-2xl"
                                    >
                                        <div className="text-xs font-bold text-text-secondary px-2 pb-2 mb-2 border-b border-glass-border uppercase tracking-wider">
                                            Select Theme Palette
                                        </div>
                                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                            {themes.map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => handleThemeChange(t.id)}
                                                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${currentTheme === t.id
                                                        ? 'bg-accent/20 border border-accent/40 text-white font-bold'
                                                        : 'hover:bg-white/10 text-text-secondary hover:text-white border border-transparent'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex gap-0.5 items-center shrink-0">
                                                            {t.colors.map((c, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="w-3 h-3 rounded-full border border-black/20"
                                                                    style={{ backgroundColor: c }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs truncate">{t.name}</span>
                                                    </div>
                                                    {currentTheme === t.id && <Check size={14} className="text-accent shrink-0 ml-1" />}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {token ? (
                            <>
                                <div className="flex items-center gap-1 bg-bg-secondary/60 p-1 rounded-xl border border-glass-border">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive(link.path)
                                                ? 'text-white bg-accent/20 border border-accent/40 shadow-lg'
                                                : 'text-text-secondary hover:text-white hover:bg-white/10'
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
                                    <button
                                        onClick={() => setIsFeedbackModalOpen(true)}
                                        className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-text-secondary hover:text-white hover:bg-slate-700/50 transition-colors"
                                    >
                                        <MessageSquare size={18} />
                                        <span className="hidden sm:inline">Feedback</span>
                                    </button>
                                    <button
                                        onClick={() => setIsChangePasswordOpen(true)}
                                        className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-text-secondary hover:text-white hover:bg-slate-700/50 transition-colors"
                                    >
                                        <Lock size={18} />
                                        <span className="hidden sm:inline">Change Password</span>
                                    </button>
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
                            className="md:hidden bg-bg-header backdrop-blur-xl border-b border-glass-border shadow-2xl max-h-[80vh] overflow-y-auto"
                        >
                            <div className="p-6 flex flex-col gap-4">
                                {/* Refresh Button for Mobile */}
                                <button
                                    onClick={() => {
                                        window.location.reload();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center gap-3 p-3 rounded-xl text-text-secondary hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                                    <span className="font-medium">Refresh</span>
                                </button>
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

                                        {/* Mobile Theme Selector */}
                                        <div className="pb-4 border-b border-white/10">
                                            <div className="text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider flex items-center gap-2">
                                                <Palette size={14} className="text-accent" />
                                                Select Theme Palette
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {themes.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => handleThemeChange(t.id)}
                                                        className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all border ${currentTheme === t.id
                                                            ? 'bg-accent/20 border-accent text-white font-bold'
                                                            : 'bg-slate-800/60 border-slate-700/50 text-text-secondary'
                                                            }`}
                                                    >
                                                        <div className="flex gap-0.5 items-center">
                                                            {t.colors.slice(0, 2).map((c, idx) => (
                                                                <span key={idx} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                                                            ))}
                                                        </div>
                                                        <span className="truncate">{t.name}</span>
                                                    </button>
                                                ))}
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
                                            <button
                                                onClick={() => {
                                                    setIsMobileMenuOpen(false);
                                                    setIsFeedbackModalOpen(true);
                                                }}
                                                className="flex items-center gap-3 p-3 rounded-xl text-text-secondary hover:bg-white/5 hover:text-white transition-colors"
                                            >
                                                <MessageSquare size={18} />
                                                <span className="font-medium">Feedback</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsMobileMenuOpen(false);
                                                    setIsChangePasswordOpen(true);
                                                }}
                                                className="flex items-center gap-3 p-3 rounded-xl text-text-secondary hover:bg-white/5 hover:text-white transition-colors"
                                            >
                                                <Lock size={18} />
                                                <span className="font-medium">Change Password</span>
                                            </button>
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
                                        {/* Mobile Theme Selector for non-logged in users */}
                                        <div className="pb-2">
                                            <div className="text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider flex items-center gap-2">
                                                <Palette size={14} className="text-accent" />
                                                Select Theme Palette
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {themes.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => handleThemeChange(t.id)}
                                                        className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all border ${currentTheme === t.id
                                                            ? 'bg-accent/20 border-accent text-white font-bold'
                                                            : 'bg-slate-800/60 border-slate-700/50 text-text-secondary'
                                                            }`}
                                                    >
                                                        <div className="flex gap-0.5 items-center">
                                                            {t.colors.slice(0, 2).map((c, idx) => (
                                                                <span key={idx} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                                                            ))}
                                                        </div>
                                                        <span className="truncate">{t.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <Link to="/login" className="btn btn-secondary w-full justify-center" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                                        <Link to="/register" className="btn btn-primary w-full justify-center" onClick={() => setIsMobileMenuOpen(false)}>Create Account</Link>
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
            <FeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
            />
            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />
        </>
    );
};

export default Navbar;
