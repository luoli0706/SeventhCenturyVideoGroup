import { Room, Player, PlayerRole } from './types';

/**
 * Checks the win condition for the current room state.
 * Returns 'civilian', 'undercover', or null if the game is still active.
 */
export function checkWinCondition(room: Room): 'civilian' | 'undercover' | null {
  const playersArr = Array.from(room.players.values());
  
  // Filter out the referee (if any) and only count players in the actual game
  const activePlayers = playersArr.filter(p => p.role !== 'referee');
  const alivePlayers = activePlayers.filter(p => p.isAlive);
  
  const aliveUndercovers = alivePlayers.filter(p => p.role === 'undercover').length;
  const aliveCivilians = alivePlayers.filter(p => p.role === 'civilian').length;
  
  // If no undercovers are alive, civilians win
  if (aliveUndercovers === 0) {
    return 'civilian';
  }
  
  // If undercovers are equal or outnumber civilians, undercovers win
  if (aliveUndercovers >= aliveCivilians) {
    return 'undercover';
  }
  
  return null;
}

/**
 * Calculates the score updates for this round.
 * Returns a map of player ID to score delta.
 */
export function calculateRoundScores(
  room: Room,
  winner: 'civilian' | 'undercover',
  votes: Map<string, string>
): Map<string, number> {
  const scoreDeltas = new Map<string, number>();
  const playersArr = Array.from(room.players.values());
  const activePlayers = playersArr.filter(p => p.role !== 'referee');
  
  // Find the undercover player(s)
  const undercoverPlayers = activePlayers.filter(p => p.role === 'undercover');
  const undercoverIds = new Set(undercoverPlayers.map(p => p.id));
  
  // Calculate vote count received by undercovers in the final vote
  let undercoverVotesCount = 0;
  votes.forEach((targetId) => {
    if (undercoverIds.has(targetId)) {
      undercoverVotesCount++;
    }
  });

  const aliveCount = activePlayers.filter(p => p.isAlive).length;

  for (const player of activePlayers) {
    let delta = 0;

    if (player.role === 'civilian') {
      // 1. Victory points
      if (winner === 'civilian') {
        delta += 20;
      }
      
      // 2. Identification points (指认分)
      // If this player voted for any of the undercovers
      const playerVoteTarget = votes.get(player.id);
      if (playerVoteTarget && undercoverIds.has(playerVoteTarget)) {
        delta += 15;
      }
    } else if (player.role === 'undercover') {
      // 1. Victory points
      if (winner === 'undercover') {
        delta += 40;
      }
      
      // 2. Survival points
      if (player.isAlive) {
        delta += 20;
        
        // 3. Low suspicion bonus (低嫌疑加成)
        // Formula: (alivePlayersCount - votesReceived) * 4
        // Calculate specific votes received by this undercover player
        let votesReceived = 0;
        votes.forEach((targetId) => {
          if (targetId === player.id) {
            votesReceived++;
          }
        });
        
        const suspicionBonus = Math.max(0, (aliveCount - votesReceived) * 4);
        delta += suspicionBonus;
      }
    }

    scoreDeltas.set(player.id, delta);
  }

  return scoreDeltas;
}

/**
 * Generates the speaking order based on the selected first speaker.
 * Speaker order follows the physical sequence number, wrapping around.
 */
export function generateSpeakerOrder(room: Room, firstSpeakerId: string): string[] {
  const playersArr = Array.from(room.players.values());
  
  // Filter only active, alive players (exclude referee)
  const speakingPlayers = playersArr.filter(p => p.role !== 'referee' && p.isAlive);
  
  // Sort players by their join sequence number
  speakingPlayers.sort((a, b) => a.sequence - b.sequence);
  
  const startIndex = speakingPlayers.findIndex(p => p.id === firstSpeakerId);
  if (startIndex === -1) {
    // Fallback if the selected first speaker is not found or dead
    return speakingPlayers.map(p => p.id);
  }
  
  const order: string[] = [];
  
  // Start from the selected first speaker to the end of the list
  for (let i = startIndex; i < speakingPlayers.length; i++) {
    order.push(speakingPlayers[i].id);
  }
  
  // Wrap around from the start of the list to the selected first speaker
  for (let i = 0; i < startIndex; i++) {
    order.push(speakingPlayers[i].id);
  }
  
  return order;
}
