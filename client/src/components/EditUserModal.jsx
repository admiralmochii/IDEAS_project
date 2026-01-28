import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/editusermodal.css';

export default function EditUserModal({ onClose, currentName, currentEmail, userId }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: currentName,
    email: currentEmail,
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match if password is being changed
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }
    }

    try {
      // Prepare data to send (only include password if it's being changed)
      const updateData = {
        name: formData.name,
        email: formData.email
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });

      const reply = await response.json();

      if (response.ok) {
        window.alert('User details updated successfully!');
        onClose();
        window.location.reload(); // Refresh to show updated data
      } else {
        throw new Error(reply.message || 'Failed to update user details');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup" onClick={onClose}>
      <div className="popup-content-edit" onClick={(e) => e.stopPropagation()}>
        <h2 className="popup-header">Edit User Details</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="password-section">
            <p className="password-note">Leave blank to keep current password</p>
            
            <div className="form-group">
              <label htmlFor="password">New Password (Optional)</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="popup-actions">
            <button 
              type="button" 
              className="popup-button" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`popup-button popup-button-primary ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? '' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
