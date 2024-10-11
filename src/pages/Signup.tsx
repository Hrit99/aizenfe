import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './Signup.css'; // Ensure to import the CSS file

const Signup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await axios.post('/auth/register', {
        username,
        password
      });

      setSuccess('Signup successful! You can now login.');
      setUsername('');
      setPassword('');
    } catch (err) {
      setError('Signup failed, please try again.');
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login'); // Navigate to login page
  };

  return (
    <div className="signup-container" style={{ margin: '0 auto' }}>
      <h2>Signup</h2>
      <form onSubmit={handleSignup}>
        <div className="form-group">
          <label className="label">Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="label">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <button type="submit" className="signup-button">Signup</button>
      </form>
      <p className="login-redirect">
        Already have an account?{' '}
        <button onClick={handleLoginRedirect} className="login-button">
          Login
        </button>
      </p>
    </div>
  );
};

export default Signup;
