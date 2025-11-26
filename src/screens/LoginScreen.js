import React, { useState } from 'react';
import '../styles/LoginScreen.css';

function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateUsername = (name) => {
    if (!name || name.trim() === '') {
      return 'Username is required';
    }
    if (name.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (name.trim().length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(name.trim())) {
      return 'Only letters, numbers, and underscores allowed';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Import nakama service dynamically to avoid circular deps
      const { authenticate, connectSocket } = await import('../services/nakama');
      
      const authResult = await authenticate(username.trim());
      
      if (!authResult.success) {
        setError(authResult.error || 'Authentication failed');
        setIsLoading(false);
        return;
      }

      const socketConnected = await connectSocket();
      if (!socketConnected) {
        setError('Failed to connect to game server');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(username.trim());
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection failed. Is the server running?');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <div className="game-logo">
            <span className="logo-x">X</span>
            <span className="logo-o">O</span>
          </div>
          <h1>Tic Tac Toe</h1>
          <p className="subtitle">Multiplayer Battle</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Enter your name</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="e.g. Player123"
              maxLength={20}
              autoComplete="off"
              autoFocus
              disabled={isLoading}
            />
            <span className="char-count">{username.length}/20</span>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="play-button"
            disabled={isLoading || username.trim().length < 3}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Connecting...
              </>
            ) : (
              'Play Now'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>🎮 Real-time multiplayer</p>
          <p>🏆 Leaderboards & rankings</p>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;