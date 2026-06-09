import { Award, ArrowRight, TrendingUp, Trophy } from 'lucide-react';
import type { RoomState } from '../../../backend/src/types';

interface ScoreboardProps {
  roomState: RoomState;
  playerId: string;
  onSend: (type: string, payload: any) => void;
  onLeave: () => void;
}

export function Scoreboard({ roomState, playerId, onSend, onLeave }: ScoreboardProps) {
  const isHost = roomState.ownerId === playerId;
  const isLastRound = roomState.currentRound >= roomState.totalRounds;
  const isGrandFinale = isLastRound && roomState.showGrandFinale;

  // Sort leaderboard players by score descending
  const sortedPlayers = Object.entries(roomState.leaderboard)
    .map(([id, score]) => {
      const p = roomState.players.find(player => player.id === id);
      return {
        id,
        nickname: p ? p.nickname : 'Unknown Player',
        score,
        isOwner: p ? p.isOwner : false
      };
    })
    .sort((a, b) => b.score - a.score);

  // 1. Grand Finale view (Podium + Complete Leaderboard)
  if (isGrandFinale) {
    const gold = sortedPlayers[0];
    const silver = sortedPlayers[1];
    const bronze = sortedPlayers[2];

    return (
      <div className="min-h-screen bg-[#050811] text-gray-200 p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center mb-6 animate-float">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
          <h1 className="text-3xl font-black text-white">终极计分榜</h1>
          <p className="text-gray-500 text-xs tracking-wider mt-1 uppercase">Grand Finale Leaderboard</p>
        </div>

        {/* Podium */}
        <div className="w-full max-w-md flex justify-center items-end gap-3 mb-8 h-40">
          {/* 2nd place (Silver) */}
          {silver && (
            <div className="flex flex-col items-center flex-1">
              <div className="text-3xs text-gray-400 font-bold mb-1 max-w-[80px] truncate">{silver.nickname}</div>
              <div className="w-full bg-slate-800 border-t-2 border-slate-500/40 rounded-t-xl h-20 flex flex-col items-center justify-center shadow-lg">
                <span className="text-xl font-black text-slate-300">2</span>
                <span className="text-3xs text-slate-400 mt-0.5">{silver.score}分</span>
              </div>
            </div>
          )}

          {/* 1st place (Gold) */}
          {gold && (
            <div className="flex flex-col items-center flex-1">
              <div className="text-3xs text-yellow-400 font-bold mb-1 max-w-[90px] truncate animate-bounce">{gold.nickname}</div>
              <div className="w-full bg-gradient-to-t from-yellow-950/40 to-yellow-600/30 border-t-4 border-yellow-500 rounded-t-2xl h-28 flex flex-col items-center justify-center shadow-xl shadow-yellow-500/10">
                <span className="text-3xl font-black text-yellow-400">1</span>
                <span className="text-2xs text-yellow-300 font-bold mt-0.5">{gold.score}分</span>
              </div>
            </div>
          )}

          {/* 3rd place (Bronze) */}
          {bronze && (
            <div className="flex flex-col items-center flex-1">
              <div className="text-3xs text-amber-500 font-bold mb-1 max-w-[80px] truncate">{bronze.nickname}</div>
              <div className="w-full bg-slate-850 border-t-2 border-amber-600/40 rounded-t-xl h-16 flex flex-col items-center justify-center shadow-md">
                <span className="text-base font-black text-amber-600">3</span>
                <span className="text-3xs text-amber-500/80 mt-0.5">{bronze.score}分</span>
              </div>
            </div>
          )}
        </div>

        {/* Complete Standings List */}
        <div className="w-full max-w-md glass-card rounded-2xl p-5 mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">
            玩家积分总排行
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {sortedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                  player.id === playerId ? 'bg-indigo-950/30 border border-indigo-500/20' : 'bg-slate-950/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-3xs text-gray-500 w-4 font-bold">{idx + 1}.</span>
                  <span className="text-white font-semibold">{player.nickname}</span>
                </div>
                <span className="text-indigo-400 font-bold">{player.score}分</span>
              </div>
            ))}
          </div>
        </div>

        {/* Restart controls */}
        <div className="w-full max-w-md space-y-3">
          {isHost ? (
            <div className="space-y-3">
              <button
                onClick={() => onSend('restart_game', { keepScore: true })}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-500/20"
              >
                保留当前积分，再来一轮！
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onSend('restart_game', { keepScore: false })}
                  className="py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-gray-200 text-xs font-bold rounded-xl transition"
                >
                  积分清零，再来一轮
                </button>
                <button
                  onClick={() => {
                    // This returns status to 'lobby' while clearing score
                    onSend('restart_game', { keepScore: false });
                  }}
                  className="py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-gray-200 text-xs font-bold rounded-xl transition"
                >
                  修改配置并重开
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-3.5 bg-slate-950/40 rounded-xl border border-slate-900">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse mr-2"></span>
              <span className="text-xs text-gray-400 font-semibold">等待房主选择重开选项...</span>
            </div>
          )}

          <button
            onClick={() => {
              if (window.confirm('确定退出房间吗？')) {
                onLeave();
              }
            }}
            className="w-full bg-slate-850/80 hover:bg-slate-800/80 border border-slate-800 text-white text-xs font-bold py-3 rounded-xl transition shadow-lg shadow-slate-950/25"
          >
            退出房间
          </button>
        </div>
      </div>
    );
  }

  // 2. Round Settlement view (Intermediate round summary)
  const roundHist = roomState.roundHistory[roomState.roundHistory.length - 1];
  const lastWinner = roundHist ? roundHist.winner : 'civilian';
  const undercoverWord = roundHist ? roundHist.undercoverWord : '';
  const civilianWord = roundHist ? roundHist.civilianWord : '';

  return (
    <div className="min-h-screen bg-[#050811] text-gray-200 p-4 flex flex-col items-center justify-center">
      {/* Title */}
      <div className="text-center mb-6">
        <Award className="w-12 h-12 text-indigo-400 mx-auto mb-2 animate-pulse-glow" />
        <h1 className="text-2xl font-black text-white">第 {roomState.currentRound} 局 结算</h1>
        <p className="text-gray-500 text-xs tracking-wider mt-1 uppercase">Round Results</p>
      </div>

      {/* Winner card */}
      <div className="w-full max-w-md glass-card rounded-2xl p-6 mb-6 text-center">
        <div className="mb-4">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">获胜阵营</div>
          <div className={`text-3xl font-black ${
            lastWinner === 'civilian' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.2)]'
          }`}>
            {lastWinner === 'civilian' ? '平民胜利！' : '卧底胜利！'}
          </div>
        </div>

        {/* Revealed Words */}
        <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-900">
          <div>
            <div className="text-gray-500 text-3xs font-bold mb-1">平民词汇</div>
            <div className="text-base font-black text-emerald-400">{civilianWord || '???'}</div>
          </div>
          <div className="border-l border-slate-900">
            <div className="text-gray-500 text-3xs font-bold mb-1">卧底词汇</div>
            <div className="text-base font-black text-red-400">{undercoverWord || '???'}</div>
          </div>
        </div>
      </div>

      {/* Standings & points deltas */}
      <div className="w-full max-w-md glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800/80 pb-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">当前积分排行榜</h3>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                player.id === playerId ? 'bg-indigo-950/20 border border-indigo-500/20' : 'bg-slate-950/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-300 font-semibold">{player.nickname}</span>
                {roomState.revealedWords?.[player.id] && (
                  <span className={`text-4xs px-1 rounded font-black ${
                    roomState.revealedWords[player.id] === undercoverWord
                      ? 'bg-red-950 border border-red-500/20 text-red-400'
                      : 'bg-emerald-950 border border-emerald-500/20 text-emerald-400'
                  }`}>
                    {roomState.revealedWords[player.id]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-indigo-400 font-bold">{player.score}分</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Round transition buttons */}
      <div className="w-full max-w-md space-y-3">
        {isHost ? (
          isLastRound ? (
            <button
              onClick={() => onSend('show_grand_finale', {})}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 animate-pulse-glow"
            >
              <span>查看终极排行榜</span>
              <Trophy className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onSend('next_round', {})}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/25 animate-pulse-glow"
            >
              <span>进入下一回合</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )
        ) : (
          <div className="text-center py-3.5 bg-slate-950/40 rounded-xl border border-slate-900">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse mr-2"></span>
            <span className="text-xs text-gray-400 font-semibold">
              {isLastRound ? '等待法官揭晓终极排行榜...' : '等待法官开启下一回合发牌...'}
            </span>
          </div>
        )}

        <button
          onClick={() => {
            if (window.confirm('确定退出房间吗？')) {
              onLeave();
            }
          }}
          className="w-full bg-slate-850/80 hover:bg-slate-800/80 border border-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition"
        >
          退出房间
        </button>
      </div>
    </div>
  );
}
