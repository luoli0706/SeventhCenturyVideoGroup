import { WebSocket } from 'ws';
import { Room, RoomState, Player, PlayerRole, GameMode, RoomStatus, WsMessage } from './types';
import { checkWinCondition, calculateRoundScores, generateSpeakerOrder } from './gameLogic';
import * as db from './db';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private turnTimers: Map<string, NodeJS.Timeout> = new Map();

  clearTurnTimer(roomId: string) {
    const timer = this.turnTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.turnTimers.delete(roomId);
    }
  }

  startTurnTimer(room: Room, speakerId: string) {
    this.clearTurnTimer(room.id);
    
    room.speakerDeadline = Date.now() + 60000;
    
    const timer = setTimeout(() => {
      const speaker = room.players.get(speakerId);
      const nickname = speaker ? speaker.nickname : '玩家';
      
      this.broadcastToRoom(room, {
        type: 'chat_message',
        payload: {
          senderId: 'system',
          senderName: '系统',
          text: `${nickname} 发言超时，已自动跳过。`
        }
      });
      
      room.completedSpeakers.push(speakerId);
      this.advanceSpeaker(room);
    }, 60000);
    
    this.turnTimers.set(room.id, timer);
  }

  createRoom(roomId: string, mode: GameMode, ownerId: string, nickname: string, ws: WebSocket): Room {
    const room: Room = {
      id: roomId,
      mode,
      status: 'lobby',
      players: new Map(),
      currentRound: 0,
      totalRounds: 5,
      categoryIds: [],
      maxPlayers: 8,
      ownerParticipates: true,
      ownerId,
      currentSpeakerId: null,
      speakerOrder: [],
      completedSpeakers: [],
      speakerDeadline: null,
      votes: new Map(),
      winner: null,
      leaderboard: new Map(),
      roundHistory: [],
      wordA: null,
      wordB: null,
      undercoverId: null,
      revealedWords: null,
      showGrandFinale: false
    };

    // Add owner as the first player
    const ownerPlayer: Player & { ws: WebSocket } = {
      id: ownerId,
      nickname,
      isAlive: true,
      isOwner: true,
      role: null,
      currentWord: null,
      votesReceived: 0,
      sequence: 1,
      ws
    };

    room.players.set(ownerId, ownerPlayer);
    room.leaderboard.set(ownerId, 0);
    this.rooms.set(roomId, room);

    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  joinRoom(room: Room, playerId: string, nickname: string, ws: WebSocket): Player {
    const sequence = room.players.size + 1;
    const player: Player & { ws: WebSocket } = {
      id: playerId,
      nickname,
      isAlive: true,
      isOwner: room.ownerId === playerId,
      role: null,
      currentWord: null,
      votesReceived: 0,
      sequence,
      ws
    };

    room.players.set(playerId, player);
    if (!room.leaderboard.has(playerId)) {
      room.leaderboard.set(playerId, 0);
    }

    return player;
  }

  leaveRoom(roomId: string, playerId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players.delete(playerId);
    room.leaderboard.delete(playerId);

    if (room.players.size === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    // If owner leaves, transfer ownership to the next player
    if (room.ownerId === playerId) {
      const nextOwnerId = Array.from(room.players.keys())[0];
      this.transferOwner(room, nextOwnerId);
    }

    // If game was active, we might need to recalculate speaker orders or win conditions
    if (room.status !== 'lobby' && room.status !== 'ended') {
      // Clean up player speaker list
      room.speakerOrder = room.speakerOrder.filter(id => id !== playerId);
      room.completedSpeakers = room.completedSpeakers.filter(id => id !== playerId);
      room.votes.delete(playerId);
      
      if (room.currentSpeakerId === playerId) {
        this.advanceSpeaker(room);
      } else {
        this.checkGameRoundProgress(room);
      }
    }

    return room;
  }

  transferOwner(room: Room, targetId: string) {
    const previousOwner = room.players.get(room.ownerId);
    if (previousOwner) {
      previousOwner.isOwner = false;
    }
    
    const newOwner = room.players.get(targetId);
    if (newOwner) {
      newOwner.isOwner = true;
      room.ownerId = targetId;
    }
  }

  async setupGameRound(room: Room) {
    this.clearTurnTimer(room.id);
    room.speakerDeadline = null;
    room.currentRound++;
    room.votes.clear();
    room.revealedWords = null;
    room.winner = null;
    room.showGrandFinale = false;

    // Reset player states for the new round
    room.players.forEach(p => {
      p.isAlive = true;
      p.role = null;
      p.currentWord = null;
      p.votesReceived = 0;
    });

    if (room.mode === 'offline') {
      room.ownerParticipates = false;
      const referee = room.players.get(room.ownerId);
      if (referee) {
        referee.role = 'referee';
        referee.isAlive = false; // Referee doesn't participate
      }

      // Offline mode: Random select word pair and assign roles directly
      await this.selectRandomWords(room);
      this.assignRolesAndWords(room);
      room.status = 'offline_playing';
      this.broadcastRoomState(room);
      this.sendPrivateWords(room);
    } else {
      // Online mode:
      if (!room.ownerParticipates) {
        // Referee Mode
        const referee = room.players.get(room.ownerId);
        if (referee) {
          referee.role = 'referee';
          referee.isAlive = false; // Referee doesn't participate in guessing/voting
        }

        // Fetch word options for referee
        room.status = 'referee_selecting_word';
        this.broadcastRoomState(room);
        await this.sendRefereeWordOptions(room);
      } else {
        // Normal Mode (Host participates)
        await this.selectRandomWords(room);
        this.assignRolesAndWords(room);
        room.status = 'select_first_speaker';
        this.broadcastRoomState(room);
        this.sendPrivateWords(room);
      }
    }
  }

  async selectRandomWords(room: Room) {
    let categoriesToUse = room.categoryIds;
    if (categoriesToUse.length === 0) {
      // Default to the first category if none selected
      const cats = await db.getCategories();
      if (cats.length > 0) {
        categoriesToUse = [cats[0].id];
      }
    }

    const allWordPairs: db.WordPair[] = [];
    for (const catId of categoriesToUse) {
      const pairs = await db.getWordsByCategory(catId);
      allWordPairs.push(...pairs);
    }

    if (allWordPairs.length === 0) {
      room.wordA = '苹果';
      room.wordB = '梨子';
    } else {
      const selected = allWordPairs[Math.floor(Math.random() * allWordPairs.length)];
      // Randomly assign word_a/word_b to civilian/undercover
      if (Math.random() > 0.5) {
        room.wordA = selected.word_a;
        room.wordB = selected.word_b;
      } else {
        room.wordA = selected.word_b;
        room.wordB = selected.word_a;
      }
    }
  }

  async sendRefereeWordOptions(room: Room) {
    const owner = room.players.get(room.ownerId);
    if (!owner) return;

    let categoriesToUse = room.categoryIds;
    if (categoriesToUse.length === 0) {
      const cats = await db.getCategories();
      if (cats.length > 0) {
        categoriesToUse = [cats[0].id];
      }
    }

    const allWordPairs: db.WordPair[] = [];
    for (const catId of categoriesToUse) {
      const pairs = await db.getWordsByCategory(catId);
      allWordPairs.push(...pairs);
    }

    // Get up to 5 random pairs
    const shuffled = [...allWordPairs].sort(() => 0.5 - Math.random());
    const options = shuffled.slice(0, 5).map(p => ({ id: p.id, word_a: p.word_a, word_b: p.word_b }));

    this.sendToPlayer(owner.ws, {
      type: 'referee_word_options',
      payload: options
    });
  }

  assignRolesAndWords(room: Room) {
    const playersArr = Array.from(room.players.values());
    const activePlayers = playersArr.filter(p => p.role !== 'referee');
    
    const count = activePlayers.length;
    if (count === 0) return;

    // Determine undercover count: 6人及以下为1，7-9人为2，10-12人为3
    let undercoverCount = 1;
    if (count >= 10) {
      undercoverCount = 3;
    } else if (count >= 7) {
      undercoverCount = 2;
    } else {
      undercoverCount = 1;
    }

    // 安全容错：如果卧底数大于等于总人数，保留至少一名平民，除非总人数就是 1
    if (undercoverCount >= count && count > 1) {
      undercoverCount = count - 1;
    }

    // Shuffle active players to assign undercovers randomly
    const shuffledPlayers = [...activePlayers].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const p = shuffledPlayers[i];
      if (i < undercoverCount) {
        p.role = 'undercover';
        p.currentWord = room.wordB; // Undercover gets Word B
      } else {
        p.role = 'civilian';
        p.currentWord = room.wordA; // Civilian gets Word A
      }
    }
  }

  sendPrivateWords(room: Room) {
    room.players.forEach(p => {
      if (p.role && p.role !== 'referee' && p.currentWord) {
        this.sendToPlayer(p.ws, {
          type: 'your_word',
          payload: {
            word: p.currentWord
          }
        });
      }
    });
  }

  selectFirstSpeaker(room: Room, playerId: string) {
    room.currentSpeakerId = playerId;
    room.speakerOrder = generateSpeakerOrder(room, playerId);
    room.completedSpeakers = [];
    room.status = 'playing_description';
    this.startTurnTimer(room, playerId);
  }

  handlePlayerDescription(room: Room, playerId: string, text: string) {
    if (room.status !== 'playing_description' || room.currentSpeakerId !== playerId) return;

    this.clearTurnTimer(room.id);
    room.completedSpeakers.push(playerId);
    
    // Broadcast text to players via speaker log (handled by frontend state addition)
    this.advanceSpeaker(room);
  }

  advanceSpeaker(room: Room) {
    const remaining = room.speakerOrder.filter(id => !room.completedSpeakers.includes(id));
    
    if (remaining.length > 0) {
      room.currentSpeakerId = remaining[0];
      this.startTurnTimer(room, remaining[0]);
      this.broadcastRoomState(room);
    } else {
      // Everyone spoke once! Move to voting
      this.clearTurnTimer(room.id);
      room.speakerDeadline = null;
      room.currentSpeakerId = null;
      room.status = 'playing_voting';
      room.votes.clear();
      this.broadcastRoomState(room);
    }
  }

  handlePlayerVote(room: Room, voterId: string, targetId: string) {
    if (room.status !== 'playing_voting') return;
    
    const voter = room.players.get(voterId);
    if (!voter || !voter.isAlive || voter.role === 'referee') return;

    room.votes.set(voterId, targetId);
    
    this.checkGameRoundProgress(room);
  }

  checkGameRoundProgress(room: Room) {
    const aliveVoters = Array.from(room.players.values()).filter(p => p.role !== 'referee' && p.isAlive);
    
    // Check if everyone voted
    if (room.votes.size >= aliveVoters.length) {
      this.executeVotingResult(room);
    } else {
      // Broadcast current vote count (without revealing who voted for whom yet)
      this.broadcastRoomState(room);
    }
  }

  executeVotingResult(room: Room) {
    // Count votes
    const voteCounts: Record<string, number> = {};
    room.votes.forEach((targetId) => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    // Find player with max votes
    let maxVotes = 0;
    let targetToEliminate: string | null = null;
    let isTie = false;

    Object.entries(voteCounts).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        targetToEliminate = playerId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    });

    // In case of tie or no votes, pick one of the tied players randomly
    if (isTie && targetToEliminate) {
      const tiedPlayers = Object.entries(voteCounts)
        .filter(([_, count]) => count === maxVotes)
        .map(([playerId]) => playerId);
      targetToEliminate = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
    }

    // Eliminate the player
    if (targetToEliminate) {
      const eliminatedPlayer = room.players.get(targetToEliminate);
      if (eliminatedPlayer) {
        eliminatedPlayer.isAlive = false;
        
        // Reveal word of the eliminated player
        room.revealedWords = new Map();
        room.revealedWords.set(eliminatedPlayer.id, eliminatedPlayer.currentWord || '');

        // Broadcast intermediate result
        this.broadcastToRoom(room, {
          type: 'reveal_words',
          payload: {
            revealed: { [eliminatedPlayer.id]: eliminatedPlayer.currentWord || '' },
            eliminatedPlayer: {
              nickname: eliminatedPlayer.nickname,
              role: eliminatedPlayer.role,
              word: eliminatedPlayer.currentWord
            }
          }
        });
      }
    }

    // Check win conditions
    const roundWinner = checkWinCondition(room);
    if (roundWinner) {
      this.endGameRound(room, roundWinner);
    } else {
      // Next description round: return to designated speaker phase
      room.status = 'select_first_speaker';
      this.broadcastRoomState(room);
    }
  }

  eliminatePlayerOffline(room: Room, playerId: string) {
    if (room.status !== 'offline_playing') return;

    const player = room.players.get(playerId);
    if (player) {
      player.isAlive = false;
    }

    const roundWinner = checkWinCondition(room);
    if (roundWinner) {
      this.endGameRound(room, roundWinner);
    } else {
      this.broadcastRoomState(room);
    }
  }

  endGameRound(room: Room, winner: 'civilian' | 'undercover') {
    this.clearTurnTimer(room.id);
    room.speakerDeadline = null;
    room.winner = winner;
    room.status = 'ended';
    room.showGrandFinale = false;

    // Calculate scores
    const scoreDeltas = calculateRoundScores(room, winner, room.votes);
    scoreDeltas.forEach((delta, playerId) => {
      const currentScore = room.leaderboard.get(playerId) || 0;
      room.leaderboard.set(playerId, currentScore + delta);
    });

    // Capture round history
    const undercoverPlayers = Array.from(room.players.values()).filter(p => p.role === 'undercover');
    const civilianPlayers = Array.from(room.players.values()).filter(p => p.role === 'civilian');
    
    room.roundHistory.push({
      round: room.currentRound,
      undercoverWord: room.wordB || '',
      civilianWord: room.wordA || '',
      winner,
      eliminatedPlayers: Array.from(room.players.values())
        .filter(p => !p.isAlive && p.role !== 'referee')
        .map(p => ({ nickname: p.nickname, role: p.role || '', word: p.currentWord || '' }))
    });

    // Reveal ALL words at end of round
    room.revealedWords = new Map();
    room.players.forEach(p => {
      if (p.role && p.role !== 'referee') {
        room.revealedWords?.set(p.id, p.currentWord || '');
      }
    });

    this.broadcastToRoom(room, {
      type: 'reveal_words',
      payload: {
        revealed: Object.fromEntries(room.revealedWords.entries()),
        winner,
        scoreDeltas: Object.fromEntries(scoreDeltas.entries())
      }
    });

    this.broadcastRoomState(room);
  }

  getSerializableStateForPlayer(room: Room, playerId: string): RoomState {
    const playersArr = Array.from(room.players.values());
    const recipient = room.players.get(playerId);
    const isRecipientReferee = recipient?.role === 'referee';

    const players = playersArr.map(({ ws, currentWord, role, ...rest }) => {
      // Expose details if status is ended, lobby, or the recipient is the referee.
      const showDetails = room.status === 'ended' || room.status === 'lobby' || isRecipientReferee;
      
      return {
        ...rest,
        role: showDetails ? role : (role === 'referee' ? 'referee' : null),
        ...(showDetails ? { currentWord } : {})
      };
    });

    return {
      id: room.id,
      mode: room.mode,
      status: room.status,
      players,
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      categoryIds: room.categoryIds,
      maxPlayers: room.maxPlayers,
      ownerParticipates: room.ownerParticipates,
      ownerId: room.ownerId,
      currentSpeakerId: room.currentSpeakerId,
      speakerOrder: room.speakerOrder,
      completedSpeakers: room.completedSpeakers,
      speakerDeadline: room.speakerDeadline,
      votes: Object.fromEntries(room.votes.entries()),
      winner: room.winner,
      leaderboard: Object.fromEntries(room.leaderboard.entries()),
      roundHistory: room.roundHistory,
      revealedWords: room.revealedWords ? Object.fromEntries(room.revealedWords.entries()) : null,
      showGrandFinale: room.showGrandFinale
    };
  }

  getSerializableState(room: Room): RoomState {
    return this.getSerializableStateForPlayer(room, '');
  }

  broadcastRoomState(room: Room) {
    room.players.forEach(p => {
      if (p.ws.readyState === WebSocket.OPEN) {
        const state = this.getSerializableStateForPlayer(room, p.id);
        try {
          p.ws.send(JSON.stringify({
            type: 'room_state',
            payload: state
          }));
        } catch (e) {
          console.error('WS broadcast error:', e);
        }
      }
    });
  }

  broadcastToRoom(room: Room, msg: WsMessage) {
    const raw = JSON.stringify(msg);
    room.players.forEach(p => {
      if (p.ws.readyState === WebSocket.OPEN) {
        try { p.ws.send(raw); } catch (e) { console.error('WS broadcast error:', e); }
      }
    });
  }

  sendToPlayer(ws: WebSocket, msg: WsMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify(msg)); } catch (e) { console.error('WS unicast error:', e); }
    }
  }
}
