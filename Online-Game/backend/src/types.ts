
export type GameMode = 'online' | 'offline';
export type RoomStatus = 
  | 'lobby' 
  | 'referee_selecting_word' 
  | 'select_first_speaker' 
  | 'playing_description' 
  | 'playing_voting' 
  | 'offline_playing' 
  | 'ended';

export type PlayerRole = 'civilian' | 'undercover' | 'referee' | null;

export interface Player {
  id: string;
  nickname: string;
  isAlive: boolean;
  isOwner: boolean;
  role: PlayerRole;
  currentWord: string | null;
  votesReceived: number;
  sequence: number; // Join sequence order (e.g., 1, 2, 3...)
}

export interface RoomState {
  id: string;
  mode: GameMode;
  status: RoomStatus;
  players: (Omit<Player, 'currentWord'> & { currentWord?: string | null })[]; // Don't expose words to other players unless they are referee
  currentRound: number;
  totalRounds: number;
  categoryIds: number[];
  maxPlayers: number;
  ownerParticipates: boolean;
  ownerId: string;
  currentSpeakerId: string | null;
  speakerOrder: string[];
  completedSpeakers: string[];
  speakerDeadline: number | null; // Unix timestamp in ms
  votes: Record<string, string>; // voterId -> targetId
  winner: 'civilian' | 'undercover' | null;
  leaderboard: Record<string, number>; // playerId -> score
  roundHistory: {
    round: number;
    undercoverWord: string;
    civilianWord: string;
    winner: 'civilian' | 'undercover';
    eliminatedPlayers: { nickname: string; role: string; word: string }[];
  }[];
  revealedWords: Record<string, string> | null; // playerId -> word (revealed at the end of round/game)
  showGrandFinale: boolean;
}

export interface Room {
  id: string;
  mode: GameMode;
  status: RoomStatus;
  players: Map<string, Player & { ws: any }>;
  currentRound: number;
  totalRounds: number;
  categoryIds: number[];
  maxPlayers: number;
  ownerParticipates: boolean;
  ownerId: string;
  currentSpeakerId: string | null;
  speakerOrder: string[];
  completedSpeakers: string[];
  speakerDeadline: number | null;
  votes: Map<string, string>; // voterId -> targetId
  winner: 'civilian' | 'undercover' | null;
  leaderboard: Map<string, number>; // playerId -> score
  roundHistory: RoomState['roundHistory'];
  wordA: string | null; // civilian word
  wordB: string | null; // undercover word
  undercoverId: string | null;
  revealedWords: Map<string, string> | null;
  showGrandFinale: boolean;
}

export interface WsMessage<T = any> {
  type: string;
  payload: T;
}
