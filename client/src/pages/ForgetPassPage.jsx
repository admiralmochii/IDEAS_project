import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import forgetpassIcon from '../assets/forgetpass.svg';
import '../styles/forgetpassword.css';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setEmail(e.target.value);
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
                credentials: "include"
            });

            const reply = await response.json();

            if (response.ok) {
                setSuccess('Password reset link sent! Check your email.');
            } else {
                throw new Error(reply.message || 'Failed to send reset link');
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-page">
            <div className="forgot-password-container">
                <h1>Forgot Your Password?</h1>
                <p className="forgot-password-subtitle">
                    Type your email and we'll send a link to reset it
                </p>

                <div className="forgot-password-icon">
                    <img src={forgetpassIcon} alt="Forgot Password" />
                </div>
                
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
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className={`forgot-password-btn ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? '' : 'Send Link'}
                    </button>

                    <button 
                        type="button" 
                        className="back-btn"
                        onClick={() => navigate('/login')}
                    >
                        Back
                    </button>
                </form>
            </div>
        </div>
    );
}
