// Check if someone won
export const checkWinner = (board) => {
  const winCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (let combo of winCombinations) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

// Check if board is full (draw)
export const isBoardFull = (board) => {
  return board.every(cell => cell !== null);
};

// Get valid moves
export const getValidMoves = (board) => {
  return board
    .map((cell, index) => cell === null ? index : null)
    .filter(index => index !== null);
};