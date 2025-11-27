# 🎮 Multiplayer Tic-Tac-Toe

A production-ready, real-time multiplayer Tic-Tac-Toe game built with **React** and **Nakama** game server.

![Game Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react) ![Nakama](https://img.shields.io/badge/Nakama-3.24.2-purple)

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| 🎮 **Game** | [http://ec2-34-228-198-235.compute-1.amazonaws.com](http://ec2-34-228-198-235.compute-1.amazonaws.com) |
| 🔧 **Nakama API** | [http://ec2-34-228-198-235.compute-1.amazonaws.com:7350](http://ec2-34-228-198-235.compute-1.amazonaws.com:7350) |
| 📊 **Nakama Console** | [http://ec2-34-228-198-235.compute-1.amazonaws.com:7351](http://ec2-34-228-198-235.compute-1.amazonaws.com:7351) |

---

## ✨ Features

### Core Features
- ✅ **Real-time Multiplayer** - Play against other players in real-time
- ✅ **Server-Authoritative Logic** - All game logic validated server-side
- ✅ **Automatic Matchmaking** - Find opponents automatically
- ✅ **WebSocket Communication** - Low-latency game updates

### Bonus Features
- 🏆 **Leaderboard System** - Track wins, losses, and rankings
- ⏱️ **Timed Mode** - 30-second turn timer for fast-paced games
- 📊 **Player Statistics** - Track your performance over time
- 🔄 **Reconnection Handling** - Graceful disconnect handling

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │   HTTP  │                 │   SQL   │                 │
│  React Client   │◄───────►│  Nakama Server  │◄───────►│   PostgreSQL    │
│  (Frontend)     │   WS    │  (Game Logic)   │         │   (Database)    │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        │                           │
        ▼                           ▼
   Port 80 (HTTP)            Port 7350 (API)
                             Port 7351 (Console)
```

### Server-Authoritative Design

All game logic runs on the Nakama server to prevent cheating:

1. **Move Validation** - Server validates every move before applying
2. **Win Detection** - Server determines game outcomes
3. **Turn Management** - Server controls whose turn it is
4. **State Broadcasting** - Server broadcasts verified state to all clients

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- AWS Account (for deployment)

### Local Development

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/multiplayer-tictactoe.git
cd multiplayer-tictactoe
```

**2. Start the backend**
```bash
cd backend
docker-compose up -d
```

**3. Start the frontend**
```bash
cd frontend
npm install
npm start
```

**4. Open the game**
```
http://localhost:3000
```

---

## 🧪 Testing Multiplayer

To test the multiplayer functionality:

1. Open the game in **Chrome**: `http://ec2-34-228-198-235.compute-1.amazonaws.com`
2. Open the same URL in **Chrome Incognito** (or another browser)
3. Login as `player1` in one window, `player2` in the other
4. Click **"Find Opponent"** in both windows
5. Wait for matchmaking to pair you (usually ~25 seconds)
6. Play the game!

---

## 📁 Project Structure

```
multiplayer-tictactoe/
├── backend/
│   ├── docker-compose.yml    # Container orchestration
│   ├── nakama.yml            # Nakama configuration
│   └── modules/
│       └── main.js           # Server-side game logic
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── screens/          # Game screens
│   │   ├── services/
│   │   │   └── nakama.js     # Nakama client SDK
│   │   └── styles/           # CSS files
│   └── public/
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, CSS3 |
| Backend | Nakama 3.24.2 |
| Database | PostgreSQL 13 |
| Deployment | AWS EC2, Nginx |
| Container | Docker, Docker Compose |

---

## 📖 Documentation

- [Backend README](./backend/README.md) - Server setup and API docs
- [Frontend README](./frontend/README.md) - Client setup and components

---

## 📄 License

This project is built as an assignment for **LILA Games**.

---

<p align="center">
  Made with ❤️ for LILA Games
</p>
