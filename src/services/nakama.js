import { Client } from '@heroiclabs/nakama-js';

// Configuration
const SERVER_KEY = 'defaultkey';
const SERVER_HOST = 'localhost';
const SERVER_PORT = '7350';  // HTTP API port
const SECURE = false;

// State
let client = null;
let session = null;
let socket = null;
let matchId = null;
let currentPlayerId = null;

// Initialize client
try {
  client = new Client(SERVER_KEY, SERVER_HOST, SERVER_PORT, SECURE);
  console.log('✅ Nakama Client initialized on port', SERVER_PORT);
} catch (error) {
  console.error('❌ Failed to create Nakama client:', error);
}

/**
 * Validate username
 */
function validateUsername(username) {
  if (!username || username.trim() === '') {
    return { valid: false, error: 'Username cannot be empty' };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (trimmed.length > 128) {
    return { valid: false, error: 'Username must be less than 128 characters' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true };
}

/**
 * Authenticate user with device ID
 */
export async function authenticate(username) {
  console.log('🔐 Authenticating:', username);

  if (!client) {
    return { success: false, error: 'Client not initialized' };
  }

  const validation = validateUsername(username);
  if (!validation.valid) {
    console.error('❌ Validation failed:', validation.error);
    return { success: false, error: validation.error };
  }

  const cleanUsername = username.trim();
  const deviceId = `device_${cleanUsername}`;

  try {
    session = await client.authenticateDevice(deviceId, true, cleanUsername);
    
    if (session && session.user_id) {
      currentPlayerId = session.user_id;
      console.log('✅ Authenticated! User ID:', currentPlayerId);
      return { success: true };
    } else {
      return { success: false, error: 'No user ID in session' };
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
    
    if (error.status === 400) {
      return { success: false, error: 'Invalid username. Use 3+ alphanumeric characters.' };
    }
    if (error.status === 404) {
      return { success: false, error: 'Server not reachable. Check if Nakama is running.' };
    }
    
    return { success: false, error: error.message || 'Authentication failed' };
  }
}

/**
 * Connect WebSocket
 */
export async function connectSocket() {
  if (!session || !client) {
    console.error('❌ Must authenticate first');
    return false;
  }

  try {
    socket = client.createSocket();
    await socket.connect(session, true);
    
    socket.ondisconnect = (event) => {
      console.warn('⚠️ Socket disconnected:', event);
    };
    
    console.log('✅ WebSocket connected');
    return true;
  } catch (error) {
    console.error('❌ Socket connection failed:', error);
    return false;
  }
}

/**
 * Find opponent via matchmaking
 */
export async function findMatch(mode = 'classic') {
  if (!socket) {
    console.error('❌ Socket not connected');
    return { matchId: null };
  }

  try {
    // addMatchmaker(query, minCount, maxCount, stringProperties, numericProperties)
    const ticket = await socket.addMatchmaker(
      '*',                    // query - match anyone
      2,                      // minCount
      2,                      // maxCount
      { mode: mode },         // stringProperties - game mode
      {}                      // numericProperties
    );
    
    console.log('🎯 Added to matchmaker, ticket:', ticket.ticket);
    return { matchId: null, ticket: ticket.ticket };
  } catch (error) {
    console.error('❌ Matchmaking failed:', error);
    return { matchId: null };
  }
}

/**
 * Set up matchmaker matched handler
 */
export function onMatchmakerMatched(callback) {
  if (!socket) return;
  
  socket.onmatchmakermatched = async (matched) => {
    console.log('🎮 Match found!', matched);
    
    try {
      const match = await socket.joinMatch(matched.match_id);
      matchId = match.match_id;
      console.log('✅ Joined match:', matchId);
      callback(match);
    } catch (error) {
      console.error('❌ Failed to join match:', error);
    }
  };
}

/**
 * Set up match data handler
 */
export function onMatchData(callback) {
  if (!socket) return;
  
  socket.onmatchdata = (result) => {
    try {
      let data = {};
      if (result.data) {
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(result.data);
        data = JSON.parse(jsonString);
      }
      
      console.log('📨 Match data received:', { opCode: result.op_code, data });
      callback({
        opCode: result.op_code,
        senderId: result.presence ? result.presence.user_id : null,
        data: data
      });
    } catch (error) {
      console.error('❌ Error parsing match data:', error);
    }
  };
}

/**
 * Set up presence handler
 */
export function onMatchPresence(callback) {
  if (!socket) return;
  
  socket.onmatchpresence = (presences) => {
    console.log('👥 Presence update:', presences);
    callback(presences.joins || [], presences.leaves || []);
  };
}

/**
 * Send move
 */
export async function sendMove(position) {
  if (!socket || !matchId) {
    console.error('❌ Not in a match');
    return false;
  }

  try {
    const data = JSON.stringify({ position: position });
    const encoder = new TextEncoder();
    
    // OpCode 2 = MOVE
    socket.sendMatchState(matchId, 2, encoder.encode(data));
    console.log('📤 Move sent:', position);
    return true;
  } catch (error) {
    console.error('❌ Failed to send move:', error);
    return false;
  }
}

/**
 * Leave match
 */
export async function leaveMatch() {
  if (!socket || !matchId) return;
  
  try {
    await socket.leaveMatch(matchId);
    console.log('✅ Left match:', matchId);
    matchId = null;
  } catch (error) {
    console.error('❌ Error leaving match:', error);
  }
}

/**
 * Disconnect
 */
export async function disconnect() {
  if (matchId) await leaveMatch();
  
  if (socket) {
    socket.disconnect(true);
    socket = null;
  }
  
  session = null;
  currentPlayerId = null;
  console.log('✅ Disconnected');
}

// ==================== LEADERBOARD & STATS (via RPC) ====================

/**
 * Get leaderboard - calls server RPC
 */
export async function getLeaderboard(limit = 10) {
  if (!client || !session) {
    console.warn('⚠️ Not authenticated for leaderboard');
    return [];
  }

  try {
    const response = await client.rpc(session, 'get_leaderboard', JSON.stringify({ limit }));
    const result = JSON.parse(response.payload);
    
    console.log('📊 Leaderboard loaded:', result);
    
    if (result.success && result.leaderboard) {
      return result.leaderboard.map(entry => ({
        rank: entry.rank,
        odId: entry.odId,
        username: entry.username || 'Unknown',
        wins: entry.wins || 0,
        losses: entry.losses || 0,
        draws: entry.draws || 0,
        rating: entry.rating || 1200,
        winStreak: entry.winStreak || 0
      }));
    }
    
    return [];
  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    return [];
  }
}

/**
 * Get player stats - calls server RPC
 */
export async function getPlayerStats(userId = null) {
  if (!client || !session) {
    console.warn('⚠️ Not authenticated for stats');
    return { wins: 0, losses: 0, draws: 0, rating: 1200, rank: '-' };
  }

  try {
    const payload = userId ? JSON.stringify({ userId }) : '{}';
    const response = await client.rpc(session, 'get_player_stats', payload);
    const result = JSON.parse(response.payload);
    
    console.log('📊 Player stats loaded:', result);
    
    if (result.success && result.stats) {
      return {
        wins: result.stats.wins || 0,
        losses: result.stats.losses || 0,
        draws: result.stats.draws || 0,
        totalGames: result.stats.totalGames || 0,
        rating: result.stats.rating || 1200,
        winStreak: result.stats.winStreak || 0,
        rank: '-'  // Rank comes from leaderboard position
      };
    }
    
    return { wins: 0, losses: 0, draws: 0, rating: 1200, rank: '-' };
  } catch (error) {
    console.error('❌ Stats error:', error);
    return { wins: 0, losses: 0, draws: 0, rating: 1200, rank: '-' };
  }
}

/**
 * Update player stats (win/loss/draw) - calls server RPC
 */
export async function updateStats(result) {
  if (!client || !session) {
    console.warn('⚠️ Not authenticated for stats update');
    return false;
  }

  try {
    const response = await client.rpc(session, 'update_stats', JSON.stringify({ result }));
    const data = JSON.parse(response.payload);
    
    console.log('📊 Stats updated:', data);
    return data.success;
  } catch (error) {
    console.error('❌ Stats update error:', error);
    return false;
  }
}

/**
 * Health check - calls server RPC
 */
export async function healthCheck() {
  if (!client || !session) {
    return { status: 'not_connected' };
  }

  try {
    const response = await client.rpc(session, 'healthcheck', '{}');
    return JSON.parse(response.payload);
  } catch (error) {
    console.error('❌ Health check error:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * List active matches - calls server RPC
 */
export async function listMatches() {
  if (!client || !session) {
    return [];
  }

  try {
    const response = await client.rpc(session, 'list_matches', '{}');
    const result = JSON.parse(response.payload);
    return result.success ? result.matches : [];
  } catch (error) {
    console.error('❌ List matches error:', error);
    return [];
  }
}

// Getters
export function getMatchId() { return matchId; }
export function getPlayerId() { return currentPlayerId; }
export function getSession() { return session; }
export function isAuthenticated() { return session !== null; }
export function isConnected() { return socket !== null; }