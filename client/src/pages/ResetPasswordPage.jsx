import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import '../styles/resetpassword.css';

export default function ResetPasswordPage() {
    const { resetId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);

    useEffect(() => {
        // Validate reset token on mount
        async function validateResetToken() {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/verify-reset-request/${resetId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    const data = await response.json();
                    setError(data.message || 'Invalid or expired reset link');
                    setValidating(false);
                    return;
                }

                setValidating(false);
            } catch (err) {
                setError('Failed to validate reset link');
                setValidating(false);
            }
        }

        validateResetToken();
    }, [resetId]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password length
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/reset-password/${resetId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: formData.password })
            });

            const reply = await response.json();

            if (response.ok) {
                setSuccess('Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                throw new Error(reply.message || 'Failed to reset password');
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="reset-password-page">
                <div className="reset-password-container">
                    <div className="loading-message">Validating reset link...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <h1>Reset Your Password</h1>
                <p className="reset-password-subtitle">
                    Enter your new password below
                </p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="password">New Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            minLength={8}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            minLength={8}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className={`reset-password-btn ${loading ? 'loading' : ''}`}
                        disabled={loading || !!error}
                    >
                        {loading ? '' : 'Reset Password'}
                    </button>

                    <button 
                        type="button" 
                        className="back-btn"
                        onClick={() => navigate('/login')}
                    >
                        Back to Login
                    </button>
                </form>
            </div>
        </div>
    );
}
