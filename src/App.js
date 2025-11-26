import React, { useState, useEffect } from 'react';
import './App.css';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState('classic');
  const [gameData, setGameData] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { isAuthenticated } = await import('./services/nakama');
      if (isAuthenticated()) {
        // Could restore session here
      }
    } catch (e) {
      // No existing session
    }
  };

  const handleLogin = (name) => {
    setPlayerName(name);
    setCurrentScreen('home');
  };

  const handleLogout = async () => {
    try {
      const { disconnect } = await import('./services/nakama');
      await disconnect();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setPlayerName('');
    setCurrentScreen('login');
  };

  const handlePlayClick = (mode) => {
    setGameMode(mode);
    setCurrentScreen('game');
  };

  const handleGameEnd = (result) => {
    setGameData(result);
    setCurrentScreen('result');
  };

  const handlePlayAgain = () => {
    setGameData(null);
    setCurrentScreen('game');
  };

  const handleGoHome = () => {
    setGameData(null);
    setCurrentScreen('home');
  };

  const handleBackFromGame = async () => {
    try {
      const { leaveMatch } = await import('./services/nakama');
      await leaveMatch();
    } catch (e) {
      console.error('Error leaving match:', e);
    }
    setCurrentScreen('home');
  };

  // Render current screen
  switch (currentScreen) {
    case 'login':
      return <LoginScreen onLoginSuccess={handleLogin} />;
    
    case 'home':
      return (
        <HomeScreen 
          playerName={playerName} 
          onPlayClick={handlePlayClick}
          onLogout={handleLogout}
        />
      );
    
    case 'game':
      return (
        <GameScreen 
          playerName={playerName}
          gameMode={gameMode}
          onGameEnd={handleGameEnd}
          onBack={handleBackFromGame}
        />
      );
    
    case 'result':
      return (
        <ResultScreen 
          gameData={gameData}
          playerName={playerName}
          onPlayAgain={handlePlayAgain}
          onHome={handleGoHome}
        />
      );
    
    default:
      return <LoginScreen onLoginSuccess={handleLogin} />;
  }
}

export default App;