import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../utils/api';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            if (!token) {
                setStatus('error');
                setMessage('No verification token found');
                return;
            }

            try {
                const res = await axios.post(`${API_URL}/api/auth/verify-email`, { token });
                // Auto-login user
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setStatus('success');
                setMessage(res.data.msg);
                setTimeout(() => navigate('/dashboard'), 2000);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.msg || 'Verification failed');
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card max-w-md w-full text-center">
                {status === 'loading' && (
                    <div>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-accent mx-auto mb-4"></div>
                        <p className="text-text-secondary">Verifying your email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div>
                        <div className="text-green-500 text-6xl mb-4">✓</div>
                        <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
                        <p className="text-text-secondary mb-4">{message}</p>
                        <p className="text-sm text-text-secondary">Redirecting to dashboard...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <div className="text-red-500 text-6xl mb-4">✗</div>
                        <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
                        <p className="text-text-secondary">{message}</p>
                        <button 
                            onClick={() => navigate('/login')} 
                            className="btn btn-primary mt-4"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;