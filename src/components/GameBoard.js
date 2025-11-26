import React from 'react';

function GameBoard({ board, onCellClick }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 100px)',
      gap: '10px',
      backgroundColor: '#333',
      padding: '10px',
      borderRadius: '10px'
    }}>
      {board.map((cell, index) => (
        <button
          key={index}
          onClick={() => onCellClick(index)}
          style={{
            width: '100px',
            height: '100px',
            fontSize: '32px',
            fontWeight: 'bold',
            backgroundColor: cell ? '#00d4ff' : '#555',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {cell}
        </button>
      ))}
    </div>
  );
}

export default GameBoard;