import React, { useState, useEffect } from 'react';
import '../styles/HomeScreen.css';
import * as Nakama from '../services/nakama';

function HomeScreen({ playerName, onFindGame, onLogout }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerStats, setPlayerStats] = useState({ 
    wins: 0, 
    losses: 0, 
    draws: 0, 
    rating: 1200,
    winStreak: 0,
    totalGames: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMode, setSelectedMode] = useState('classic');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    // Load leaderboard via RPC
    try {
      const leaderboardData = await Nakama.getLeaderboard(10);
      setLeaderboard(leaderboardData || []);
      console.log('📊 Leaderboard loaded:', leaderboardData);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard');
      setLeaderboard([]);
    }

    // Load player stats via RPC
    try {
      const stats = await Nakama.getPlayerStats();
      setPlayerStats({
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        draws: stats.draws || 0,
        rating: stats.rating || 1200,
        winStreak: stats.winStreak || 0,
        totalGames: stats.totalGames || 0
      });
      console.log('📊 Player stats loaded:', stats);
    } catch (err) {
      console.error('Failed to load player stats:', err);
    }

    setIsLoading(false);
  };

  const handlePlayClick = () => {
    onFindGame(selectedMode);
  };

  const getWinRate = () => {
    const total = playerStats.wins + playerStats.losses;
    if (total === 0) return '0%';
    return Math.round((playerStats.wins / total) * 100) + '%';
  };

  const currentPlayerId = Nakama.getPlayerId();

  return (
    <div className="home-screen">
      <div className="home-container">
        {/* Header */}
        <header className="home-header">
          <div className="user-info">
            <div className="avatar">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="welcome-text">Welcome back,</span>
              <span className="username">{playerName}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </header>

        {/* Player Stats Bar */}
        <div className="player-stats-bar">
          <div className="stat">
            <span className="stat-value">{playerStats.wins}</span>
            <span className="stat-label">Wins</span>
          </div>
          <div className="stat">
            <span className="stat-value">{playerStats.losses}</span>
            <span className="stat-label">Losses</span>
          </div>
          <div className="stat">
            <span className="stat-value">{playerStats.draws}</span>
            <span className="stat-label">Draws</span>
          </div>
          <div className="stat">
            <span className="stat-value">{getWinRate()}</span>
            <span className="stat-label">Win Rate</span>
          </div>
          <div className="stat">
            <span className="stat-value">{playerStats.rating}</span>
            <span className="stat-label">Rating</span>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="mode-section">
          <h2>Select Game Mode</h2>
          <div className="mode-cards">
            <div 
              className={`mode-card ${selectedMode === 'classic' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('classic')}
            >
              <div className="mode-icon">⚔️</div>
              <h3>Classic</h3>
              <p>No time limit, pure strategy</p>
              <span className="mode-badge">Popular</span>
            </div>
            <div 
              className={`mode-card ${selectedMode === 'timed' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('timed')}
            >
              <div className="mode-icon">⏱️</div>
              <h3>Timed</h3>
              <p>30 seconds per turn</p>
              <span className="mode-badge">Fast-paced</span>
            </div>
          </div>
        </div>

        {/* Play Button */}
        <button className="main-play-button" onClick={handlePlayClick}>
          <span className="play-icon">▶</span>
          Find Opponent
        </button>

        {/* Leaderboard Section */}
        <div className="leaderboard-section">
          <div className="section-header">
            <h2>🏆 Leaderboard</h2>
            <button className="view-all-btn" onClick={() => setShowModal(true)}>
              View All
            </button>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Loading leaderboard...</span>
            </div>
          ) : error ? (
            <div className="error-state">
              <span>❌ {error}</span>
              <button onClick={loadData}>Retry</button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="empty-state">
              <span>🏆</span>
              <p>No records yet</p>
              <span className="hint">Be the first to win a game!</span>
            </div>
          ) : (
            <div className="leaderboard-list">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div 
                  key={entry.odId || index} 
                  className={`leaderboard-item ${entry.odId === currentPlayerId ? 'is-me' : ''}`}
                >
                  <span className={`rank rank-${entry.rank}`}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                  </span>
                  <span className="player-name">
                    {entry.username}
                    {entry.odId === currentPlayerId && <span className="me-badge">YOU</span>}
                  </span>
                  <span className="wins">{entry.wins}W</span>
                  <span className="rating">⭐ {entry.rating}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="home-footer">
          <p>🎮 Multiplayer Tic-Tac-Toe • Real-time battles</p>
        </footer>
      </div>

      {/* Full Leaderboard Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏆 Global Leaderboard</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {isLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <span>Loading...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="empty-state">
                  <span>🏆</span>
                  <p>No records yet</p>
                </div>
              ) : (
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      <th>Wins</th>
                      <th>Losses</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr 
                        key={entry.odId || index}
                        className={entry.odId === currentPlayerId ? 'is-me' : ''}
                      >
                        <td className="rank">
                          {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                        </td>
                        <td className="player-name">
                          {entry.username}
                          {entry.odId === currentPlayerId && <span className="me-badge">YOU</span>}
                        </td>
                        <td className="wins">{entry.wins}</td>
                        <td className="losses">{entry.losses || 0}</td>
                        <td className="rating">{entry.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="refresh-btn" 
                onClick={loadData}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeScreen;