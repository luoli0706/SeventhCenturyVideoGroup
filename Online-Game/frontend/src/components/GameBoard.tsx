import React, { useState, useRef, useEffect } from 'react';
import { EyeOff, Send, Check, ShieldAlert } from 'lucide-react';
import type { RoomState, Player } from '../../../backend/src/types';
import type { YourWord, ChatMessage } from '../hooks/useWebSocket';
import { RefereePanel } from './RefereePanel';
import type { RefereeWordOption } from '../hooks/useWebSocket';

interface GameBoardProps {
  roomState: RoomState;
  playerId: string;
  yourWord: YourWord | null;
  refereeWordOptions: RefereeWordOption[];
  chatMessages: ChatMessage[];
  onSend: (type: string, payload: any) => void;
  onLeave: () => void;
}

export function GameBoard({
  roomState,
  playerId,
  yourWord,
  refereeWordOptions,
  chatMessages,
  onSend,
  onLeave
}: GameBoardProps) {
  const [showWord, setShowWord] = useState(false);
  const [description, setDescription] = useState('');
  const [votedTargetId, setVotedTargetId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Description countdown timer
  useEffect(() => {
    if (roomState.status !== 'playing_description' || !roomState.speakerDeadline) {
      setTimeLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const remaining = Math.max(0, Math.ceil((roomState.speakerDeadline! - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimeLeft();

    const interval = setInterval(updateTimeLeft, 250);
    return () => clearInterval(interval);
  }, [roomState.status, roomState.speakerDeadline]);

  const handleSendDescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onSend('send_description', { text: description.trim() });
    setDescription('');
  };

  const handleVoteSubmit = () => {
    if (!votedTargetId) return;
    onSend('cast_vote', { targetPlayerId: votedTargetId });
  };

  // Find player helpers
  const getPlayer = (id: string): Player | undefined => {
    return roomState.players.find(p => p.id === id) as Player | undefined;
  };

  const isReferee = roomState.players.find(p => p.id === playerId)?.role === 'referee';
  const isAlive = getPlayer(playerId)?.isAlive ?? false;
  const isMySpeakerTurn = roomState.currentSpeakerId === playerId;
  
  const currentSpeaker = roomState.currentSpeakerId ? getPlayer(roomState.currentSpeakerId) : null;
  const hasVoted = !!roomState.votes[playerId];

  // Render Host Referee views
  const isHost = roomState.ownerId === playerId;
  const showHostPanel = (roomState.status === 'referee_selecting_word' || roomState.status === 'select_first_speaker' || roomState.status === 'offline_playing') && isHost;

  return (
    <div className="min-h-screen bg-[#050811] text-gray-200 p-4 flex flex-col items-center">
      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
        <div>
          <div className="text-2xs text-indigo-400 font-bold uppercase tracking-widest">
            第 {roomState.currentRound} / {roomState.totalRounds} 局
          </div>
          <h2 className="text-base font-black text-white">
            {roomState.status === 'playing_description' && '发言描述阶段'}
            {roomState.status === 'playing_voting' && '投票淘汰阶段'}
            {roomState.status === 'offline_playing' && '线下讨论中'}
            {roomState.status === 'referee_selecting_word' && '裁判选词中'}
            {roomState.status === 'select_first_speaker' && '指定首发言人'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={() => {
                if (window.confirm('确定要中断当前游戏并返回等待大厅吗？')) {
                  onSend('abort_game', {});
                }
              }}
              className="text-3xs bg-red-955/80 border border-red-800/40 hover:bg-red-900 text-red-300 font-bold px-2 py-1 rounded-lg transition cursor-pointer"
            >
              中断游戏
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm('确定要退出该房间吗？')) {
                onLeave();
              }
            }}
            className="text-3xs bg-slate-900 border border-slate-850 hover:bg-slate-800 text-gray-400 font-bold px-2 py-1 rounded-lg transition cursor-pointer"
          >
            退出房间
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-xl space-y-4 flex-grow flex flex-col">
        {/* God view for host or referee panel */}
        {showHostPanel ? (
          <RefereePanel
            roomState={roomState}
            playerId={playerId}
            refereeWordOptions={refereeWordOptions}
            onSend={onSend}
          />
        ) : (
          <>
            {/* Referee God View Console (Online Mode) */}
            {isReferee && (roomState.status === 'playing_description' || roomState.status === 'playing_voting') && (
              <div className="glass-card rounded-2xl p-5 border border-slate-900 w-full">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-400 animate-pulse-glow" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">法官天眼控制台 (线上模式)</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {roomState.players
                    .filter(p => p.role !== 'referee')
                    .map(p => (
                      <div
                        key={p.id}
                        className={`p-2 bg-slate-950/60 border rounded-xl flex items-center justify-between text-xs ${
                          p.isAlive
                            ? p.role === 'undercover'
                              ? 'border-red-950/80 bg-red-955/5'
                              : 'border-slate-900'
                            : 'border-slate-950 opacity-40'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-1">
                            <span>{p.nickname}</span>
                            <span className="text-4xs text-gray-500">({p.sequence}号)</span>
                          </div>
                          <div className="text-4xs text-gray-400 mt-0.5">
                            词汇: <span className={p.role === 'undercover' ? 'text-red-400' : 'text-emerald-400'}>{p.currentWord || '无'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-4xs px-1 py-0.5 rounded font-black uppercase ${
                            p.role === 'undercover'
                              ? 'bg-red-950 border border-red-500/20 text-red-400'
                              : 'bg-emerald-950 border border-emerald-500/20 text-emerald-400'
                          }`}>
                            {p.role === 'undercover' ? '卧底' : '平民'}
                          </span>
                          <div className="text-4xs text-gray-500 mt-1">{p.isAlive ? '存活' : '已淘汰'}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Word Card for non-referee and alive players */}
            {!isReferee && isAlive && yourWord && (
              <div className="glass-card rounded-2xl p-5 border border-slate-900 text-center relative overflow-hidden">
                <div className="text-3xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  我的秘密词汇 (防窥遮罩)
                </div>
                
                {/* Hold to Reveal Card */}
                <div
                  onMouseDown={() => setShowWord(true)}
                  onMouseUp={() => setShowWord(false)}
                  onMouseLeave={() => setShowWord(false)}
                  onTouchStart={() => setShowWord(true)}
                  onTouchEnd={() => setShowWord(false)}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-6 cursor-pointer select-none transition-all duration-300 active:scale-[0.98] active:border-indigo-500/60 max-w-xs mx-auto flex flex-col items-center justify-center h-24 relative"
                >
                  {showWord ? (
                    <>
                      <div className="text-2xl font-black text-indigo-400 tracking-wide animate-pulse-glow">
                        {yourWord.word}
                      </div>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-8 h-8 text-gray-600 mb-1" />
                      <div className="text-xs text-gray-400 font-bold">按住 / 长按此卡片查看词汇</div>
                    </>
                  )}
                </div>
                <div className="text-4xs text-gray-500 mt-2">松开后词汇自动隐藏，防止旁边玩家偷瞄</div>
              </div>
            )}

            {/* Online Mode - Wait for first speaker selection */}
            {roomState.status === 'select_first_speaker' && !isHost && (
              <div className="glass-card rounded-2xl p-6 border border-slate-900 text-center space-y-4">
                <div className="w-10 h-10 rounded-full bg-indigo-950 flex items-center justify-center mx-auto text-indigo-400 border border-indigo-900 animate-pulse">
                  ⏱️
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">等待指定首发言人</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  房主正在挑选本局的第一个发言玩家，请做好描述发言的准备。
                </p>
              </div>
            )}

            {/* Offline Mode - Player Wait Board */}
            {roomState.mode === 'offline' && roomState.status === 'offline_playing' && (
              <div className="glass-card rounded-2xl p-6 border border-slate-900 text-center space-y-4">
                <div className="w-10 h-10 rounded-full bg-indigo-950 flex items-center justify-center mx-auto text-indigo-400 border border-indigo-900 animate-pulse">
                  💬
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">大家正在线下进行描述讨论</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  请查看你手上的秘密词汇，并与房间内的其他玩家轮流发言描述。讨论结束后，请配合法官在现实中投票淘汰。
                </p>
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 text-2xs text-gray-500">
                  房主已作为法官主持，请听从法官的淘汰宣布。
                </div>
              </div>
            )}

            {/* Online Mode - Speaker description board */}
            {roomState.status === 'playing_description' && (
              <div className="glass-card rounded-2xl border border-slate-900 flex-grow flex flex-col overflow-hidden min-h-[300px]">
                {/* Speaker indicator bar */}
                <div className="bg-slate-950/80 border-b border-slate-900 px-4 py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-gray-300">
                      {isMySpeakerTurn ? '轮到你描述了！' : `等待描述: ${currentSpeaker?.nickname || '???'}`}
                    </span>
                    {timeLeft !== null && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded font-black text-2xs ${
                        timeLeft <= 10
                          ? 'text-red-400 bg-red-950/60 border border-red-500/30 animate-pulse'
                          : 'text-indigo-400 bg-indigo-950/60 border border-indigo-900/30'
                      }`}>
                        {timeLeft}s
                      </span>
                    )}
                  </div>
                  <span className="text-2xs text-gray-500 font-bold bg-slate-900 px-2 py-0.5 rounded">
                    进度: {roomState.completedSpeakers.length} / {roomState.speakerOrder.length}
                  </span>
                </div>

                {/* Chat Message list */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3 max-h-[320px]">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-xs text-gray-600 py-10">
                      发言顺序：{roomState.speakerOrder.map((id, idx) => (
                        <span key={id} className="text-indigo-400/80 font-semibold">
                          {getPlayer(id)?.nickname || '???'}{idx < roomState.speakerOrder.length - 1 ? ' ➡️ ' : ''}
                        </span>
                      ))}
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const isMe = msg.senderId === playerId;
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-3xs text-gray-500 mb-0.5 font-bold">{msg.senderName}</span>
                          <div className={`px-3.5 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                            isMe
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                              : 'bg-slate-900 border border-slate-800 text-gray-300 rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input box */}
                <form onSubmit={handleSendDescription} className="bg-slate-950/80 border-t border-slate-900 p-3 flex gap-2">
                  <input
                    type="text"
                    disabled={!isMySpeakerTurn || !isAlive}
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 30))}
                    placeholder={
                      !isAlive
                        ? '你已被淘汰，进入观战天眼模式...'
                        : isMySpeakerTurn
                        ? '输入你的词汇描述词汇（不超过30字）...'
                        : `请等待 ${currentSpeaker?.nickname || '其它人'} 发言...`
                    }
                    className="flex-grow bg-slate-900 border border-slate-800 disabled:opacity-50 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!isMySpeakerTurn || !description.trim() || !isAlive}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl p-2.5 transition flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 fill-current" />
                  </button>
                </form>
              </div>
            )}

            {/* Online Mode - Voting board */}
            {roomState.status === 'playing_voting' && (
              <div className="glass-card rounded-2xl p-6 border border-slate-900 text-center flex-grow flex flex-col justify-center min-h-[300px]">
                <h3 className="text-base font-bold text-white mb-1">谁是卧底？请投出你怀疑的一票</h3>
                <p className="text-2xs text-gray-500 mb-5">得票最高的玩家将被投出并淘汰。请深思熟虑！</p>

                {hasVoted ? (
                  /* Voted Waiting Screen */
                  <div className="space-y-4 py-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center mx-auto text-emerald-400">
                      <Check className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-gray-300">你已提交投票！正在等待其他玩家完成投票...</p>
                    
                    {/* Progress details */}
                    <div className="bg-slate-950/50 rounded-xl border border-slate-900 p-4 max-w-sm mx-auto text-left">
                      <span className="text-3xs font-bold text-gray-500 uppercase tracking-wider block mb-2">玩家投票进度</span>
                      <div className="flex flex-wrap gap-2">
                        {roomState.players
                          .filter(p => p.role !== 'referee' && p.isAlive)
                          .map(p => {
                            const voted = !!roomState.votes[p.id];
                            return (
                              <span
                                key={p.id}
                                className={`text-3xs px-2 py-0.5 rounded font-semibold ${
                                  voted
                                    ? 'bg-emerald-950/45 border border-emerald-900/60 text-emerald-400'
                                    : 'bg-slate-900 border border-slate-800 text-gray-500'
                                }`}
                              >
                                {p.nickname} {voted ? '✓' : '...'}
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Voting Form */
                  <div className="space-y-5 flex-grow flex flex-col justify-between">
                    {!isAlive ? (
                      <div className="text-center text-xs text-gray-500 py-6">
                        你已被淘汰，本轮无投票权。请等待存活玩家投票...
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {roomState.players
                            .filter(p => p.role !== 'referee' && p.isAlive && p.id !== playerId)
                            .map((p) => (
                              <div
                                key={p.id}
                                onClick={() => setVotedTargetId(p.id)}
                                className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                                  votedTargetId === p.id
                                    ? 'bg-red-950/20 border-red-500 font-bold neo-glow-red'
                                    : 'bg-slate-950/60 border-slate-900 hover:border-slate-850'
                                }`}
                              >
                                <span className="text-xs text-white font-semibold">{p.nickname}</span>
                                <span className="text-4xs text-gray-500 block mt-1">序号: {p.sequence}</span>
                              </div>
                            ))}
                        </div>

                        <button
                          onClick={handleVoteSubmit}
                          disabled={!votedTargetId}
                          className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition"
                        >
                          确认投票
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
