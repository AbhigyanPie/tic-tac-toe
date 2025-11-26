import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/GameScreen.css';

// Op codes (must match server)
const OpCode = {
  GAME_STATE: 1,
  MOVE: 2,
  GAME_OVER: 3,
  ERROR: 4,
  TURN_UPDATE: 5,
  PLAYER_JOIN: 6,
  PLAYER_LEAVE: 7
};

function GameScreen({ playerName, gameMode, onGameEnd, onBack }) {
  // Game state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [mySymbol, setMySymbol] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [currentSymbol, setCurrentSymbol] = useState('X');
  const [players, setPlayers] = useState({});
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  // Connection state
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const [matchId, setMatchId] = useState(null);

  // Timer state (for timed mode)
  const [timeRemaining, setTimeRemaining] = useState(30);
  const timerRef = useRef(null);

  // Nakama service ref
  const nakamaRef = useRef(null);

  // Initialize matchmaking
  useEffect(() => {
    initializeGame();

    return () => {
      // Cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      cleanupGame();
    };
  }, []);

  // Timer effect for timed mode
  useEffect(() => {
    if (gameMode === 'timed' && matchId && !gameOver && isMyTurn()) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentTurn, matchId, gameOver, gameMode]);

  const initializeGame = async () => {
    try {
      setStatus('connecting');
      
      const nakama = await import('../services/nakama');
      nakamaRef.current = nakama;

      // Set up match handlers
      nakama.onMatchmakerMatched((match) => {
        console.log('Match found:', match);
        setMatchId(match.match_id);
        setStatus('waiting_for_players');
      });

      nakama.onMatchData((data) => {
        handleMatchData(data);
      });

      nakama.onMatchPresence((joins, leaves) => {
        handlePresenceChange(joins, leaves);
      });

      // Start matchmaking
      setStatus('searching');
      const result = await nakama.findMatch();
      
      if (result.ticket) {
        console.log('Matchmaking ticket:', result.ticket);
      }
    } catch (err) {
      console.error('Game initialization error:', err);
      setError('Failed to connect to game server');
      setStatus('error');
    }
  };

  const handleMatchData = useCallback((message) => {
    console.log('Match data received:', message);

    try {
      const { opCode, data } = message;

      switch (opCode) {
        case OpCode.PLAYER_JOIN:
          if (data.yourSymbol) {
            setMySymbol(data.yourSymbol);
            console.log('Assigned symbol:', data.yourSymbol);
          }
          break;

        case OpCode.GAME_STATE:
          if (data.type === 'game_start' || data.type === 'game_state') {
            setBoard(data.board || Array(9).fill(null));
            setCurrentTurn(data.currentTurn);
            setCurrentSymbol(data.currentSymbol || 'X');
            setPlayers(data.players || {});
            setStatus('playing');
            
            if (data.yourSymbol) {
              setMySymbol(data.yourSymbol);
            }

            // Reset timer on turn change
            if (gameMode === 'timed') {
              setTimeRemaining(30);
            }
          }
          break;

        case OpCode.GAME_OVER:
          handleGameOver(data);
          break;

        case OpCode.ERROR:
          setError(data.message);
          break;

        default:
          console.log('Unknown op code:', opCode);
      }
    } catch (err) {
      console.error('Error handling match data:', err);
    }
  }, [gameMode]);

  const handlePresenceChange = useCallback((joins, leaves) => {
    console.log('Presence changed - Joins:', joins, 'Leaves:', leaves);
    
    if (leaves && leaves.length > 0) {
      setStatus('opponent_left');
    }
  }, []);

  const handleGameOver = (data) => {
    setGameOver(true);
    setWinner(data.winner);
    
    if (data.winningLine) {
      setWinningLine(data.winningLine);
    }
    
    if (data.board) {
      setBoard(data.board);
    }

    // Navigate to result screen after delay
    setTimeout(() => {
      const result = {
        winner: data.winner,
        mySymbol: mySymbol,
        reason: data.reason,
        board: data.board || board
      };
      onGameEnd(result);
    }, 2000);
  };

  const cleanupGame = async () => {
    if (nakamaRef.current) {
      await nakamaRef.current.leaveMatch();
    }
  };

  const isMyTurn = () => {
    if (!nakamaRef.current) return false;
    const playerId = nakamaRef.current.getPlayerId();
    return currentTurn === playerId;
  };

  const handleCellClick = async (index) => {
    // Validate move
    if (!isMyTurn() || board[index] !== null || gameOver) {
      return;
    }

    try {
      // Optimistically update UI
      const newBoard = [...board];
      newBoard[index] = mySymbol;
      setBoard(newBoard);

      // Send move to server
      const success = await nakamaRef.current.sendMove(index);
      
      if (!success) {
        // Revert if failed
        setBoard(board);
        setError('Failed to send move');
      }
    } catch (err) {
      console.error('Move error:', err);
      setBoard(board);
      setError('Failed to send move');
    }
  };

  const getOpponentName = () => {
    if (!nakamaRef.current) return 'Opponent';
    const myId = nakamaRef.current.getPlayerId();
    
    for (const [id, player] of Object.entries(players)) {
      if (id !== myId) {
        return player.username || 'Opponent';
      }
    }
    return 'Opponent';
  };

  const getCellClass = (index) => {
    let classes = 'cell';
    
    if (board[index]) {
      classes += ` ${board[index]}`;
    }
    
    if (isMyTurn() && !board[index] && !gameOver) {
      classes += ' clickable';
    }
    
    if (winningLine && winningLine.includes(index)) {
      classes += ' winning';
    }
    
    return classes;
  };

  const renderStatus = () => {
    switch (status) {
      case 'connecting':
        return (
          <div className="status-message">
            <div className="spinner-large"></div>
            <p>Connecting to server...</p>
          </div>
        );

      case 'searching':
        return (
          <div className="status-message">
            <div className="search-animation">
              <span>🎯</span>
            </div>
            <p>Finding opponent...</p>
            <p className="status-hint">Usually takes 25 seconds</p>
            <button className="cancel-btn" onClick={onBack}>Cancel</button>
          </div>
        );

      case 'waiting_for_players':
        return (
          <div className="status-message">
            <div className="spinner-large"></div>
            <p>Waiting for opponent to join...</p>
          </div>
        );

      case 'opponent_left':
        return (
          <div className="status-message">
            <p className="warning-text">⚠️ Opponent disconnected</p>
            <p>You win by forfeit!</p>
            <button className="primary-btn" onClick={onBack}>Back to Home</button>
          </div>
        );

      case 'error':
        return (
          <div className="status-message error">
            <p>❌ {error || 'Connection error'}</p>
            <button className="primary-btn" onClick={onBack}>Back to Home</button>
          </div>
        );

      default:
        return null;
    }
  };

  if (status !== 'playing') {
    return (
      <div className="game-screen">
        <div className="game-container">
          <h1 className="game-title">
            <span className="x">X</span>
            <span className="o">O</span>
          </h1>
          {renderStatus()}
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen">
      <div className="game-container">
        {/* Header */}
        <header className="game-header">
          <div className={`player-card ${mySymbol === 'X' ? 'active' : ''}`}>
            <span className="player-symbol x">X</span>
            <span className="player-name">
              {mySymbol === 'X' ? playerName : getOpponentName()}
            </span>
            {mySymbol === 'X' && <span className="you-badge">YOU</span>}
          </div>

          <div className="vs-divider">
            <span>VS</span>
          </div>

          <div className={`player-card ${mySymbol === 'O' ? 'active' : ''}`}>
            <span className="player-symbol o">O</span>
            <span className="player-name">
              {mySymbol === 'O' ? playerName : getOpponentName()}
            </span>
            {mySymbol === 'O' && <span className="you-badge">YOU</span>}
          </div>
        </header>

        {/* Turn indicator */}
        <div className="turn-indicator">
          {isMyTurn() ? (
            <span className="your-turn">Your Turn!</span>
          ) : (
            <span className="waiting-turn">Opponent's Turn...</span>
          )}
          
          {gameMode === 'timed' && (
            <div className={`timer ${timeRemaining <= 10 ? 'warning' : ''}`}>
              ⏱️ {timeRemaining}s
            </div>
          )}
        </div>

        {/* Game Board */}
        <div className="board-container">
          <div className="game-board">
            {board.map((cell, index) => (
              <button
                key={index}
                className={getCellClass(index)}
                onClick={() => handleCellClick(index)}
                disabled={!isMyTurn() || cell !== null || gameOver}
              >
                {cell && (
                  <span className={`cell-content ${cell}`}>
                    {cell}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-content">
              {winner === 'draw' ? (
                <>
                  <span className="result-icon">🤝</span>
                  <h2>It's a Draw!</h2>
                </>
              ) : winner === mySymbol ? (
                <>
                  <span className="result-icon">🎉</span>
                  <h2>You Win!</h2>
                </>
              ) : (
                <>
                  <span className="result-icon">😔</span>
                  <h2>You Lose</h2>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="error-toast">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GameScreen;