import { useState } from 'react';
import { ShieldAlert, UserCheck, Eye, Sparkles, UserX } from 'lucide-react';
import type { RoomState } from '../../../backend/src/types';
import type { RefereeWordOption } from '../hooks/useWebSocket';

interface RefereePanelProps {
  roomState: RoomState;
  playerId: string;
  refereeWordOptions: RefereeWordOption[];
  onSend: (type: string, payload: any) => void;
}

export function RefereePanel({
  roomState,
  playerId,
  refereeWordOptions,
  onSend
}: RefereePanelProps) {
  const isHost = roomState.ownerId === playerId;

  // Word selection state
  const [selectedPairId, setSelectedPairId] = useState<number | null>(null);
  const [customWordA, setCustomWordA] = useState('');
  const [customWordB, setCustomWordB] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  // Speaker selection state
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(null);

  if (!isHost) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-900 text-center">
        <ShieldAlert className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-pulse-glow" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">正在等待裁判决定</h3>
        <p className="text-2xs text-gray-500">法官正在秘密挑选本局词组或指定首发发言人...</p>
      </div>
    );
  }

  // 1. Referee selecting word
  if (roomState.status === 'referee_selecting_word') {
    const handleConfirmWords = () => {
      if (useCustom) {
        if (!customWordA.trim() || !customWordB.trim()) {
          return alert('请输入完整的自定义词组！');
        }
        onSend('set_word_choice', {
          mode: 'custom',
          customWordA: customWordA.trim(),
          customWordB: customWordB.trim()
        });
      } else {
        if (selectedPairId === null) {
          // Random mode
          onSend('set_word_choice', { mode: 'random' });
        } else {
          const selected = refereeWordOptions.find(o => o.id === selectedPairId);
          if (selected) {
            onSend('set_word_choice', {
              mode: 'select',
              wordPairId: selected.id,
              customWordA: selected.word_a,
              customWordB: selected.word_b
            });
          }
        }
      }
    };

    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-900 w-full">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
          <Eye className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">法官秘密选词</h3>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setUseCustom(false)}
            className={`py-2 text-xs font-bold rounded-xl border transition ${
              !useCustom
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-950 border-slate-900 text-gray-400'
            }`}
          >
            系统推荐词库
          </button>
          <button
            onClick={() => setUseCustom(true)}
            className={`py-2 text-xs font-bold rounded-xl border transition ${
              useCustom
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-950 border-slate-900 text-gray-400'
            }`}
          >
            手工录入自定义
          </button>
        </div>

        {useCustom ? (
          /* Custom word input */
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-3xs font-bold text-gray-400 mb-1">词汇 A</label>
                <input
                  type="text"
                  placeholder="如: 咖啡"
                  value={customWordA}
                  onChange={(e) => setCustomWordA(e.target.value.slice(0, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-3xs font-bold text-gray-400 mb-1">词汇 B</label>
                <input
                  type="text"
                  placeholder="如: 红茶"
                  value={customWordB}
                  onChange={(e) => setCustomWordB(e.target.value.slice(0, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <p className="text-3xs text-gray-500">💡 提示: 自定义词汇可以符合当前选中的词库主题，但系统不做强制限制。</p>
          </div>
        ) : (
          /* System recommendations options */
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-400 mb-2">选择一组词汇对</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {/* Random Option */}
              <div
                onClick={() => setSelectedPairId(null)}
                className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition ${
                  selectedPairId === null
                    ? 'bg-indigo-950/35 border-indigo-500'
                    : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-white">全随机发牌</span>
                </div>
                <span className="text-3xs text-gray-500">完全交给系统决定</span>
              </div>

              {/* Recommended Pairs */}
              {refereeWordOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedPairId(opt.id)}
                  className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition ${
                    selectedPairId === opt.id
                      ? 'bg-indigo-950/35 border-indigo-500'
                      : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <span className="text-xs text-gray-300 font-semibold">{opt.word_a}</span>
                  <span className="text-3xs text-gray-500">vs</span>
                  <span className="text-xs text-gray-300 font-semibold">{opt.word_b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleConfirmWords}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-500/20"
        >
          确定该组词汇并下发
        </button>
      </div>
    );
  }

  // 2. Referee selecting first speaker
  if (roomState.status === 'select_first_speaker') {
    const activeGuessers = roomState.players.filter(p => p.role !== 'referee' && p.isAlive);

    const handleStartSpeaking = () => {
      if (!selectedSpeakerId) {
        return alert('请先选择第一个发言人！');
      }
      onSend('select_first_speaker', { playerId: selectedSpeakerId });
    };

    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-900 w-full">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
          <UserCheck className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">指定首发发言人</h3>
        </div>

        <p className="text-xs text-gray-400 mb-4">法官，请点击选择第一位描述词汇的玩家，后续玩家将按序号依次轮转发言。</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {activeGuessers.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedSpeakerId(p.id)}
              className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                selectedSpeakerId === p.id
                  ? 'bg-indigo-950/35 border-indigo-500/60 font-bold'
                  : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
              }`}
            >
              <div className="text-xs text-white font-semibold">{p.nickname}</div>
              <div className="text-3xs text-gray-500 mt-1">序号: {p.sequence}</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleStartSpeaking}
          disabled={!selectedSpeakerId}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition"
        >
          确认指定并开启回合
        </button>
      </div>
    );
  }

  // 3. Offline Moderator View (Showing identities & manually eliminating)
  if (roomState.status === 'offline_playing') {
    const activeGuessers = roomState.players.filter(p => p.role !== 'referee');

    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-900 w-full">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
          <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse-glow" />
          <h3 className="text-base font-bold text-white">法官天眼控制台 (线下模式)</h3>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          玩家已在手机上查词，请在现实中主持讨论。当玩家被投出时，点击下方“淘汰”同步状态。
        </p>

        <div className="space-y-3 mb-6">
          {activeGuessers.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 bg-slate-950/60 border rounded-xl ${
                p.isAlive ? (p.role === 'undercover' ? 'border-red-950' : 'border-slate-900') : 'border-slate-950 opacity-40'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{p.nickname}</span>
                  <span className="text-3xs text-gray-500">({p.sequence}号)</span>
                  {p.role === 'undercover' && p.isAlive && (
                    <span className="text-4xs bg-red-950 border border-red-500/30 text-red-400 px-1 rounded font-black uppercase">卧底</span>
                  )}
                  {p.role === 'civilian' && p.isAlive && (
                    <span className="text-4xs bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-1 rounded font-black uppercase">平民</span>
                  )}
                </div>
                <div className="text-3xs text-gray-500 mt-1">
                  身份: {p.role === 'undercover' ? '卧底' : '平民'} · 词汇: <span className={p.role === 'undercover' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{p.currentWord || '???'}</span> · 状态: {p.isAlive ? '存活' : '已淘汰'}
                </div>
              </div>

              {p.isAlive ? (
                <button
                  onClick={() => {
                    if (window.confirm(`确定要在系统里淘汰 [${p.nickname}] 吗？`)) {
                      onSend('eliminate_player', { playerId: p.id });
                    }
                  }}
                  className="flex items-center gap-1 bg-red-950/30 border border-red-800/30 hover:bg-red-950/80 text-red-400 text-3xs font-bold px-2 py-1.5 rounded-lg transition"
                >
                  <UserX className="w-3.5 h-3.5" />
                  淘汰
                </button>
              ) : (
                <span className="text-3xs text-gray-600 font-bold">OUT</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
