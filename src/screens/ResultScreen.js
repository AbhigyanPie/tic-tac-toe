import React from 'react';
import '../styles/ResultScreen.css';

function ResultScreen({ gameData, playerName, onPlayAgain, onHome }) {
  const { winner, mySymbol, reason, board } = gameData || {};

  const isWinner = winner === mySymbol;
  const isDraw = winner === 'draw';

  const getResultMessage = () => {
    if (isDraw) return "It's a Draw!";
    if (isWinner) {
      if (reason === 'forfeit') return 'Victory by Forfeit!';
      if (reason === 'timeout') return 'Victory by Timeout!';
      return 'You Won!';
    }
    if (reason === 'timeout') return 'Time Ran Out!';
    return 'Better Luck Next Time';
  };

  const getResultEmoji = () => {
    if (isDraw) return '🤝';
    if (isWinner) return '🏆';
    return '😔';
  };

  const getResultClass = () => {
    if (isDraw) return 'draw';
    if (isWinner) return 'win';
    return 'lose';
  };

  return (
    <div className="result-screen">
      <div className="result-container">
        {/* Result Animation */}
        <div className={`result-hero ${getResultClass()}`}>
          <span className="result-emoji">{getResultEmoji()}</span>
          <h1>{getResultMessage()}</h1>
          {!isDraw && (
            <p className="result-detail">
              {isWinner ? 'Congratulations!' : 'Don\'t give up!'}
            </p>
          )}
        </div>

        {/* Final Board State */}
        {board && (
          <div className="final-board">
            <h3>Final Board</h3>
            <div className="board-mini">
              {board.map((cell, index) => (
                <div key={index} className={`cell-mini ${cell || ''}`}>
                  {cell || ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">You played as</span>
            <span className={`stat-value symbol ${mySymbol}`}>{mySymbol}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Result</span>
            <span className={`stat-value ${getResultClass()}`}>
              {isDraw ? 'Draw' : isWinner ? '+10 pts' : '-5 pts'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="result-actions">
          <button className="action-btn primary" onClick={onPlayAgain}>
            <span>🎮</span> Play Again
          </button>
          <button className="action-btn secondary" onClick={onHome}>
            <span>🏠</span> Back to Home
          </button>
        </div>

        {/* Motivational message */}
        <div className="motivation">
          {isWinner && <p>🔥 Keep the winning streak going!</p>}
          {isDraw && <p>💪 So close! Try again for the win!</p>}
          {!isWinner && !isDraw && <p>🎯 Practice makes perfect!</p>}
        </div>
      </div>
    </div>
  );
}

export default ResultScreen;