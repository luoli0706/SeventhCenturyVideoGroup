import http from 'http';
import url from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './roomManager';
import {
  initDb,
  getCategories,
  createCategory,
  addWordPair,
  getWordsByCategory,
  updateCategory,
  deleteCategory,
  deleteWordPair,
  getCategoryBackups,
  rollbackToBackup,
  scheduleMidnightBackup
} from './db';
import { WsMessage } from './types';

const PORT = 17712;
const roomManager = new RoomManager();

// Helper to write JSON response
function jsonResponse(res: http.ServerResponse, status: number, data: any) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Helper to read JSON request body
function readJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

// CORS Headers
function setCorsHeaders(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// HTTP API Server
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '';
  const parts = pathname.split('/');

  try {
    // 1. GET /api/categories
    if (req.method === 'GET' && pathname === '/api/categories') {
      const categories = await getCategories();
      jsonResponse(res, 200, categories);
      return;
    }

    // 2. GET /api/categories/:id/words
    if (req.method === 'GET' && parts[1] === 'api' && parts[2] === 'categories' && parts[4] === 'words' && parts.length === 5) {
      const catId = parseInt(parts[3], 10);
      if (isNaN(catId)) {
        jsonResponse(res, 400, { error: 'Invalid Category ID' });
        return;
      }
      const words = await getWordsByCategory(catId);
      jsonResponse(res, 200, words);
      return;
    }

    // 3. POST /api/categories
    if (req.method === 'POST' && pathname === '/api/categories') {
      const body = await readJsonBody(req);
      if (!body.name) {
        jsonResponse(res, 400, { error: 'Category name is required' });
        return;
      }
      const category = await createCategory(body.name, body.description || null);
      jsonResponse(res, 201, category);
      return;
    }

    // 4. POST /api/categories/:id/words
    if (req.method === 'POST' && parts[1] === 'api' && parts[2] === 'categories' && parts[4] === 'words' && parts.length === 5) {
      const catId = parseInt(parts[3], 10);
      if (isNaN(catId)) {
        jsonResponse(res, 400, { error: 'Invalid Category ID' });
        return;
      }
      const body = await readJsonBody(req);
      if (!body.word_a || !body.word_b) {
        jsonResponse(res, 400, { error: 'Both word_a and word_b are required' });
        return;
      }
      const wordPair = await addWordPair(catId, body.word_a, body.word_b);
      jsonResponse(res, 201, wordPair);
      return;
    }

    // New 5: PUT /api/categories/:id
    if (req.method === 'PUT' && parts[1] === 'api' && parts[2] === 'categories' && parts.length === 4) {
      const catId = parseInt(parts[3], 10);
      if (isNaN(catId)) {
        jsonResponse(res, 400, { error: 'Invalid Category ID' });
        return;
      }
      const body = await readJsonBody(req);
      if (!body.name) {
        jsonResponse(res, 400, { error: 'Category name is required' });
        return;
      }
      const category = await updateCategory(catId, body.name, body.description || null);
      jsonResponse(res, 200, category);
      return;
    }

    // New 6: DELETE /api/categories/:id
    if (req.method === 'DELETE' && parts[1] === 'api' && parts[2] === 'categories' && parts.length === 4) {
      const catId = parseInt(parts[3], 10);
      if (isNaN(catId)) {
        jsonResponse(res, 400, { error: 'Invalid Category ID' });
        return;
      }
      await deleteCategory(catId);
      jsonResponse(res, 200, { success: true });
      return;
    }

    // New 7: DELETE /api/categories/:catId/words/:wordId
    if (req.method === 'DELETE' && parts[1] === 'api' && parts[2] === 'categories' && parts[4] === 'words' && parts.length === 6) {
      const wordId = parseInt(parts[5], 10);
      if (isNaN(wordId)) {
        jsonResponse(res, 400, { error: 'Invalid Word ID' });
        return;
      }
      await deleteWordPair(wordId);
      jsonResponse(res, 200, { success: true });
      return;
    }

    // New 8: GET /api/categories/:catId/backups
    if (req.method === 'GET' && parts[1] === 'api' && parts[2] === 'categories' && parts[4] === 'backups' && parts.length === 5) {
      const catId = parseInt(parts[3], 10);
      if (isNaN(catId)) {
        jsonResponse(res, 400, { error: 'Invalid Category ID' });
        return;
      }
      const backups = await getCategoryBackups(catId);
      jsonResponse(res, 200, backups);
      return;
    }

    // New 9: POST /api/categories/:catId/backups/:backupId/rollback
    if (req.method === 'POST' && parts[1] === 'api' && parts[2] === 'categories' && parts[4] === 'backups' && parts[6] === 'rollback' && parts.length === 7) {
      const catId = parseInt(parts[3], 10);
      const backupId = parseInt(parts[5], 10);
      if (isNaN(catId) || isNaN(backupId)) {
        jsonResponse(res, 400, { error: 'Invalid Parameters' });
        return;
      }
      await rollbackToBackup(catId, backupId);
      jsonResponse(res, 200, { success: true });
      return;
    }

    // 10. GET /api/rooms (Lobby Room List)
    if (req.method === 'GET' && pathname === '/api/rooms') {
      const activeRooms = roomManager.getAllRooms()
        .filter(r => r.status === 'lobby' && r.players.size < r.maxPlayers) // non-full lobby rooms
        .map(r => {
          const ownerPlayer = r.players.get(r.ownerId);
          return {
            roomId: r.id,
            hostName: ownerPlayer ? ownerPlayer.nickname : 'Unknown',
            playerCount: r.players.size,
            mode: r.mode,
            totalRounds: r.totalRounds
          };
        });
      jsonResponse(res, 200, activeRooms);
      return;
    }

    // Default 404
    jsonResponse(res, 404, { error: 'Not Found' });
  } catch (error: any) {
    console.error('API Error:', error);
    jsonResponse(res, 500, { error: error.message || 'Internal Server Error' });
  }
});

// WebSocket Server
const wss = new WebSocketServer({ noServer: true });

// Attach WS connections to Player IDs
interface ExtWebSocket extends WebSocket {
  isAlive?: boolean;
  roomId?: string;
  playerId?: string;
}

wss.on('connection', (ws: ExtWebSocket) => {
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async (data: string) => {
    try {
      const msg: WsMessage = JSON.parse(data);
      const { type, payload } = msg;

      switch (type) {
        case 'join_room': {
          const { roomId, nickname, playerId } = payload;
          if (!roomId || !nickname || !playerId) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Missing parameters' } }));
            return;
          }

          ws.roomId = roomId;
          ws.playerId = playerId;

          let room = roomManager.getRoom(roomId);
          if (!room) {
            // Create room (default offline first, owner configures later)
            room = roomManager.createRoom(roomId, 'offline', playerId, nickname, ws);
            console.log(`Room ${roomId} created by ${nickname} (${playerId})`);
          } else {
            // Re-associate connection if player already in room (handles reconnects!)
            const existingPlayer = room.players.get(playerId);
            if (existingPlayer) {
              existingPlayer.ws = ws;
              existingPlayer.nickname = nickname; // update name if changed
              console.log(`Player ${nickname} (${playerId}) reconnected to Room ${roomId}`);
            } else {
              // Standard join
              if (room.players.size >= room.maxPlayers) {
                ws.send(JSON.stringify({ type: 'error', payload: { message: '房间人数已满，无法加入' } }));
                return;
              }
              roomManager.joinRoom(room, playerId, nickname, ws);
              console.log(`Player ${nickname} (${playerId}) joined Room ${roomId}`);
            }
          }

          roomManager.broadcastRoomState(room);
          
          // Re-send word if game is already active and player joins/reconnects
          if (room.status !== 'lobby' && room.status !== 'ended') {
            const player = room.players.get(playerId);
            if (player && player.role && player.role !== 'referee' && player.currentWord) {
              ws.send(JSON.stringify({
                type: 'your_word',
                payload: {
                  word: player.currentWord
                }
              }));
            }
          }
          break;
        }

        case 'start_game': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.ownerId !== ws.playerId) return;

          const { mode, categoryIds, totalRounds, ownerParticipates, maxPlayers } = payload;
          room.mode = mode || 'online';
          room.categoryIds = categoryIds || [];
          room.totalRounds = totalRounds || 5;
          room.maxPlayers = maxPlayers || 8;
          room.ownerParticipates = room.mode === 'offline' ? false : (ownerParticipates !== undefined ? ownerParticipates : true);
          room.currentRound = 0;
          room.roundHistory = [];

          console.log(`Room ${room.id} starting game. Mode: ${room.mode}`);
          await roomManager.setupGameRound(room);
          break;
        }

        case 'set_word_choice': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.ownerId !== ws.playerId || room.status !== 'referee_selecting_word') return;

          const { mode, wordPairId, customWordA, customWordB } = payload;
          if (mode === 'custom' && customWordA && customWordB) {
            if (Math.random() > 0.5) {
              room.wordA = customWordA;
              room.wordB = customWordB;
            } else {
              room.wordA = customWordB;
              room.wordB = customWordA;
            }
          } else if (mode === 'select' && wordPairId) {
            // Find in db or use directly
            const wA = customWordA || '词汇 A';
            const wB = customWordB || '词汇 B';
            if (Math.random() > 0.5) {
              room.wordA = wA;
              room.wordB = wB;
            } else {
              room.wordA = wB;
              room.wordB = wA;
            }
          } else {
            // Random
            await roomManager.selectRandomWords(room);
          }

          // Assign roles
          roomManager.assignRolesAndWords(room);
          room.status = 'select_first_speaker';
          roomManager.broadcastRoomState(room);
          roomManager.sendPrivateWords(room);
          break;
        }

        case 'select_first_speaker': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.ownerId !== ws.playerId || room.status !== 'select_first_speaker') return;

          const { playerId } = payload;
          roomManager.selectFirstSpeaker(room, playerId);
          roomManager.broadcastRoomState(room);
          break;
        }

        case 'send_description': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.status !== 'playing_description' || room.currentSpeakerId !== ws.playerId) return;

          const { text } = payload;
          // Send description message to all players as a chat message event
          roomManager.broadcastToRoom(room, {
            type: 'chat_message',
            payload: {
              senderId: ws.playerId,
              senderName: room.players.get(ws.playerId)?.nickname || '',
              text
            }
          });

          roomManager.handlePlayerDescription(room, ws.playerId, text);
          break;
        }

        case 'cast_vote': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.status !== 'playing_voting') return;

          const { targetPlayerId } = payload;
          roomManager.handlePlayerVote(room, ws.playerId, targetPlayerId);
          break;
        }

        case 'eliminate_player': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.ownerId !== ws.playerId) return;

          const { playerId } = payload;
          if (room.mode === 'offline') {
            roomManager.eliminatePlayerOffline(room, playerId);
          }
          break;
        }

        case 'next_round': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.ownerId !== ws.playerId || room.status !== 'ended') return;

          if (room.currentRound >= room.totalRounds) {
            room.status = 'ended';
            roomManager.broadcastRoomState(room);
          } else {
            await roomManager.setupGameRound(room);
          }
          break;
        }

        case 'transfer_owner': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.ownerId !== ws.playerId) return;

          const { targetPlayerId } = payload;
          roomManager.transferOwner(room, targetPlayerId);
          roomManager.broadcastRoomState(room);
          break;
        }

        case 'leave_room': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (room) {
            roomManager.leaveRoom(ws.roomId, ws.playerId);
            roomManager.broadcastRoomState(room);
          }
          ws.roomId = undefined;
          ws.playerId = undefined;
          ws.send(JSON.stringify({ type: 'left_room' }));
          break;
        }

        case 'abort_game': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.ownerId !== ws.playerId) return;

          roomManager.clearTurnTimer(room.id);
          room.speakerDeadline = null;
          room.status = 'lobby';
          room.currentRound = 0;
          room.winner = null;
          room.roundHistory = [];
          room.revealedWords = null;
          room.wordA = null;
          room.wordB = null;

          roomManager.broadcastRoomState(room);
          break;
        }

        case 'update_config': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.ownerId !== ws.playerId || room.status !== 'lobby') return;

          const { mode, categoryIds, maxPlayers, totalRounds, ownerParticipates } = payload;
          room.mode = mode || 'online';
          room.categoryIds = categoryIds || [];
          room.maxPlayers = maxPlayers || 8;
          room.totalRounds = totalRounds || 5;
          room.ownerParticipates = room.mode === 'offline' ? false : (ownerParticipates !== undefined ? ownerParticipates : true);

          roomManager.broadcastRoomState(room);
          break;
        }

        case 'restart_game': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.ownerId !== ws.playerId) return;

          roomManager.clearTurnTimer(room.id);
          room.speakerDeadline = null;
          const { keepScore } = payload;
          room.status = 'lobby';
          room.currentRound = 0;
          room.winner = null;
          room.roundHistory = [];
          room.revealedWords = null;
          room.wordA = null;
          room.wordB = null;
          room.showGrandFinale = false;

          if (!keepScore) {
            room.leaderboard.clear();
            room.players.forEach(p => {
              room.leaderboard.set(p.id, 0);
            });
          }

          roomManager.broadcastRoomState(room);
          break;
        }

        case 'show_grand_finale': {
          if (!ws.roomId || !ws.playerId) return;
          const room = roomManager.getRoom(ws.roomId);
          if (!room || room.ownerId !== ws.playerId || room.status !== 'ended') return;

          room.showGrandFinale = true;
          roomManager.broadcastRoomState(room);
          break;
        }
      }
    } catch (e) {
      console.error('WS Message processing error:', e);
    }
  });

  ws.on('close', () => {
    if (ws.roomId && ws.playerId) {
      const roomId = ws.roomId;
      const playerId = ws.playerId;

      setTimeout(() => {
        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const player = room.players.get(playerId);
        // If the player reconnected within the grace period (having a new open WS connection),
        // do not clean them up!
        if (player && player.ws !== ws && player.ws.readyState === WebSocket.OPEN) {
          console.log(`Player ${playerId} reconnected to Room ${roomId} within grace period.`);
          return;
        }

        const updatedRoom = roomManager.leaveRoom(roomId, playerId);
        if (updatedRoom) {
          console.log(`Player ${playerId} disconnected from Room ${roomId} (cleanup)`);
          roomManager.broadcastRoomState(updatedRoom);
        }
      }, 3000); // 3 seconds grace period
    }
  });
});

// Ping interval to check disconnected sockets
const interval = setInterval(() => {
  wss.clients.forEach((ws: ExtWebSocket) => {
    if (ws.isAlive === false) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

// Upgrade HTTP Server to WebSockets
server.on('upgrade', (req, socket, head) => {
  const parsedUrl = url.parse(req.url || '');
  const pathname = parsedUrl.pathname || '';

  if (pathname === '/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

// Start Server after DB init
async function main() {
  console.log('Initializing SQLite Database...');
  await initDb();
  scheduleMidnightBackup(); // Start the midnight scheduler
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Who is Undercover Backend server running at http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start backend:', err);
});
