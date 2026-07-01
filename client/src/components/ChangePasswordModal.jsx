import { useState } from 'react';
import axios from 'axios';
import { X, Lock, CheckCircle } from 'lucide-react';
import API_URL from '../utils/api';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const { currentPassword, newPassword, confirmPassword } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/auth/update-password`, 
                { currentPassword, newPassword, confirmPassword },
                { headers: { 'x-auth-token': token } }
            );
            
            setSuccess(true);
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 1500);
        } catch (err) {
            console.error('Password update error:', err);
            const message = err.response?.data?.msg || err.message || 'Failed to update password';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="card w-full max-w-md relative overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors">
                    <X size={24} />
                </button>

                <div className="text-center mb-6">
                    <div className="inline-flex p-3 bg-accent/10 rounded-2xl mb-4 text-accent">
                        <Lock size={28} />
                    </div>
                    <h2 className="text-2xl font-bold">Change Password</h2>
                    <p className="text-text-secondary mt-2">Update your account password</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl mb-4 text-sm flex items-center gap-2 justify-center">
                        <CheckCircle size={18} />
                        Password updated successfully!
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary ml-1">Current Password</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={currentPassword}
                            onChange={onChange}
                            required
                            placeholder="Enter current password"
                            className="input-field"
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary ml-1">New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={newPassword}
                            onChange={onChange}
                            required
                            placeholder="Enter new password (min 6 characters)"
                            className="input-field"
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary ml-1">Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={onChange}
                            required
                            placeholder="Confirm new password"
                            className="input-field"
                            disabled={loading}
                        />
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={onClose} className="flex-1 py-3 px-4 border border-slate-700 text-white rounded-xl hover:bg-slate-800/50 transition-all" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 btn btn-primary py-3 flex items-center justify-center" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
