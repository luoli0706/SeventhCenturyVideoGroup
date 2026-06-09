import React, { useState, useEffect } from 'react';
import { Play, Users, Settings, LogIn, Eye, ShieldAlert, FilePlus } from 'lucide-react';
import type { RoomState } from '../../../backend/src/types';
import { API_BASE } from '../config';

interface LobbyProps {
  roomState: RoomState | null;
  nickname: string;
  setNickname: (val: string) => void;
  roomId: string;
  setRoomId: (val: string) => void;
  playerId: string;
  onJoin: (rId: string, name: string) => void;
  onSend: (type: string, payload: any) => void;
  onNavigateToContribute: () => void;
  onLeave: () => void;
}

interface ApiCategory {
  id: number;
  name: string;
  description: string | null;
  is_default: number;
  word_count: number;
}

interface ApiRoom {
  roomId: string;
  hostName: string;
  playerCount: number;
  mode: 'online' | 'offline';
  totalRounds: number;
}

export function Lobby({
  roomState,
  nickname,
  setNickname,
  playerId,
  onJoin,
  onSend,
  onNavigateToContribute,
  onLeave
}: LobbyProps) {
  // HTTP Fetch states
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [activeRooms, setActiveRooms] = useState<ApiRoom[]>([]);
  const [previewWords, setPreviewWords] = useState<{ word_a: string; word_b: string }[]>([]);
  const [previewCatName, setPreviewCatName] = useState<string | null>(null);
  
  // Lobby creation UI states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'online' | 'offline'>('online');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [totalRounds, setTotalRounds] = useState(5);
  const [selectedCats, setSelectedCats] = useState<number[]>([]);
  const [ownerParticipates, setOwnerParticipates] = useState(true);

  // Fetch categories and active rooms
  useEffect(() => {
    fetch(API_BASE + '/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        // Auto select first category if selectedCats is empty
        if (data.length > 0 && selectedCats.length === 0) {
          setSelectedCats([data[0].id]);
        }
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  useEffect(() => {
    if (!roomState) {
      fetch(API_BASE + '/rooms')
        .then(res => res.json())
        .then(data => setActiveRooms(data))
        .catch(err => console.error('Error fetching rooms:', err));
    }
  }, [roomState]);

  // Handle Room creation or config editing
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomState) {
      // Edit existing room config
      onSend('update_config', {
        mode: createMode,
        categoryIds: selectedCats,
        maxPlayers,
        totalRounds,
        ownerParticipates: createMode === 'offline' ? false : ownerParticipates
      });
      setShowCreateModal(false);
      return;
    }
    if (!nickname.trim()) return;

    // Generate random 4 digit room code
    const generatedRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    onJoin(generatedRoomId, nickname);
    
    // WS message will be sent after connection opens, but we also save setup configs to apply
    setTimeout(() => {
      onSend('update_config', {
        mode: createMode,
        categoryIds: selectedCats,
        maxPlayers,
        totalRounds,
        ownerParticipates: createMode === 'offline' ? false : ownerParticipates
      });
    }, 400);

    setShowCreateModal(false);
  };

  // Preview Category word list
  const handlePreviewCategory = (catId: number, catName: string) => {
    fetch(`${API_BASE}/categories/${catId}/words`)
      .then(res => res.json())
      .then(data => {
        setPreviewWords(data);
        setPreviewCatName(catName);
      })
      .catch(err => console.error('Error fetching words:', err));
  };

  // Render outside of room (Home view)
  if (!roomState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Title */}
        <div className="text-center mb-8 animate-float">
          <h1 className="text-5xl font-black tracking-tight text-white mb-2">
            谁是 <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">卧底</span>
          </h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Who is Undercover?</p>
        </div>

        {/* Home Box */}
        <div className="w-full max-w-md glass-card rounded-2xl p-6 mb-6 neo-glow">
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">我的昵称</label>
            <input
              type="text"
              placeholder="请输入游戏昵称..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 10))}
              className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => {
                if (!nickname.trim()) return alert('请先输入昵称！');
                setShowCreateModal(true);
              }}
              className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-indigo-500/20 group"
            >
              <Play className="w-6 h-6 mb-2 group-hover:rotate-12 transition-transform" />
              <span className="font-semibold text-sm">创建房间</span>
            </button>

            <button
              onClick={() => {
                if (!nickname.trim()) return alert('请先输入昵称！');
                const rCode = prompt('请输入4位数字房间号:');
                if (rCode && rCode.trim()) {
                  onJoin(rCode.trim(), nickname);
                }
              }}
              className="flex flex-col items-center justify-center bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]"
            >
              <LogIn className="w-6 h-6 mb-2" />
              <span className="font-semibold text-sm">加入房间</span>
            </button>
          </div>

          <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center">
            <span className="text-xs text-gray-400">词汇库不够丰富？</span>
            <button
              onClick={onNavigateToContribute}
              className="flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold gap-1 transition"
            >
              <FilePlus className="w-3.5 h-3.5" />
              贡献新词汇
            </button>
          </div>
        </div>

        {/* Public Room List */}
        <div className="w-full max-w-md glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">在线房间列表</h3>
          </div>

          {activeRooms.length === 0 ? (
            <p className="text-center text-xs text-gray-500 py-6">暂无在线的公开房间，快去建一个吧！</p>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {activeRooms.map((room) => (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-900 hover:border-slate-800 transition"
                >
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>房间号: {room.roomId}</span>
                      <span className="text-2xs bg-slate-800 px-1.5 py-0.5 rounded text-gray-400">
                        {room.mode === 'online' ? '线上' : '线下'}
                      </span>
                    </div>
                    <div className="text-2xs text-gray-400 mt-1">
                      房主: {room.hostName} · 局数: {room.totalRounds}局
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!nickname.trim()) return alert('请先输入昵称！');
                      onJoin(room.roomId, nickname);
                    }}
                    className="bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition"
                  >
                    加入
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Preview Modal */}
        {previewCatName && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm glass-card rounded-2xl p-5 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-1">预览: {previewCatName}</h3>
              <p className="text-2xs text-gray-400 mb-4">为了游戏公平性，不要泄露给同玩好友哦</p>
              
              <div className="max-h-60 overflow-y-auto space-y-1.5 mb-4 pr-1">
                {previewWords.map((pair, idx) => (
                  <div key={idx} className="flex justify-between p-2 bg-slate-900/60 rounded-lg text-xs border border-slate-900/40">
                    <span className="text-gray-300 font-semibold">{pair.word_a}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="text-gray-300 font-semibold">{pair.word_b}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setPreviewCatName(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-xl transition"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {/* Room Creation Configuration Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleCreateRoom} className="w-full max-w-md glass-card rounded-2xl p-6 border border-slate-800">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">配置我的房间</h3>
              </div>

              {/* Mode Selection */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">游戏模式</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateMode('online')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      createMode === 'online'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700'
                    }`}
                  >
                    线上模式 (系统流转)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode('offline')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      createMode === 'offline'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700'
                    }`}
                  >
                    线下模式 (联机发牌)
                  </button>
                </div>
              </div>

              {/* Rounds & Players */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">最大玩家数</label>
                  <input
                    type="number"
                    min="3"
                    max="12"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Math.max(3, Math.min(12, parseInt(e.target.value) || 8)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">比赛局数</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Owner role (only for online mode) */}
              {createMode === 'online' && (
                <div className="mb-4 bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>房主亲自参赛</span>
                      <ShieldAlert className="w-3 h-3 text-indigo-400" />
                    </div>
                    <div className="text-2xs text-gray-500 mt-0.5">关闭后房主充当法官，主持选词与指定先手</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={ownerParticipates}
                    onChange={(e) => setOwnerParticipates(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-700 bg-slate-900 rounded focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Choose Word Libraries */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">勾选游戏词库 (可多选)</label>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-2 bg-slate-900/40 border border-slate-900 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`cat-${cat.id}`}
                          checked={selectedCats.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCats([...selectedCats, cat.id]);
                            } else {
                              setSelectedCats(selectedCats.filter(id => id !== cat.id));
                            }
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 bg-slate-900 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={`cat-${cat.id}`} className="text-xs font-semibold text-gray-200">
                          {cat.name} ({cat.word_count}对)
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePreviewCategory(cat.id, cat.name)}
                        className="text-2xs text-gray-400 hover:text-indigo-400 flex items-center gap-0.5"
                      >
                        <Eye className="w-3 h-3" /> 预览
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={selectedCats.length === 0}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/25"
                >
                  确认开始
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Render inside room (Waiting lobby view)
  const isHost = roomState.ownerId === playerId;
  const currentOwner = roomState.players.find(p => p.id === roomState.ownerId);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Title info */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-1.5">
          <span>房间号:</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">{roomState.id}</span>
        </h2>
        <p className="text-gray-400 text-2xs tracking-widest mt-1">
          {roomState.mode === 'online' ? '线上模式 (通用的规则)' : '线下模式 (现实中主持发牌)'}
          {!roomState.ownerParticipates && roomState.mode === 'online' && ' · 房主裁判观战'}
        </p>
      </div>

      <div className="w-full max-w-md glass-card rounded-2xl p-6 mb-6">
        {/* Player List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              已加入玩家 ({roomState.players.length})
            </span>
            <span className="text-2xs text-indigo-400 font-bold bg-indigo-900/30 px-2 py-0.5 rounded">
              房主: {currentOwner ? currentOwner.nickname : 'Unknown'}
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {roomState.players.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  p.id === playerId
                    ? 'bg-indigo-950/35 border-indigo-500/60'
                    : 'bg-slate-950/60 border-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xs bg-slate-900 border border-slate-800 text-gray-400 rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-white">{p.nickname}</span>
                  {p.isOwner && <span className="text-3xs bg-amber-900/40 border border-amber-600/30 text-amber-400 px-1.5 py-0.5 rounded font-black">房主</span>}
                  {p.id === playerId && <span className="text-3xs bg-indigo-900/40 border border-indigo-600/30 text-indigo-400 px-1.5 py-0.5 rounded font-black">你</span>}
                </div>
                
                {/* Transfer host button */}
                {isHost && p.id !== playerId && (
                  <button
                    onClick={() => {
                      if (window.confirm(`确认将房主特权转交给 [${p.nickname}] 吗？`)) {
                        onSend('transfer_owner', { targetPlayerId: p.id });
                      }
                    }}
                    className="text-2xs text-gray-400 hover:text-amber-400 transition"
                  >
                    转交房主
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Configurations summary / controls */}
        {isHost ? (
          <div>
            <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 mb-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">最大人数</span>
                <span className="text-white font-bold">{roomState.players.length} / {roomState.maxPlayers}人</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">比赛总局数</span>
                <span className="text-white font-bold">{roomState.totalRounds}局</span>
              </div>
              {roomState.mode === 'online' ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">线上模式房主参战</span>
                  <span className="text-white font-bold">{roomState.ownerParticipates ? '是' : '否 (法官观战)'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">线下模式法官亲自发牌</span>
                  <span className="text-white font-bold">是 (法官不参赛)</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-900 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCreateMode(roomState.mode);
                    setMaxPlayers(roomState.maxPlayers || 8);
                    setTotalRounds(roomState.totalRounds);
                    setSelectedCats(roomState.categoryIds);
                    setOwnerParticipates(roomState.ownerParticipates);
                    setShowCreateModal(true);
                  }}
                  className="text-2xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Settings className="w-3 h-3" /> 修改配置
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                if (roomState.mode === 'online' && roomState.ownerParticipates && roomState.players.length < 3) {
                  return alert('线上参赛模式至少需要 3 名玩家！');
                }
                if (roomState.mode === 'online' && !roomState.ownerParticipates && roomState.players.length < 4) {
                  return alert('裁判模式下，除去裁判外至少需要 3 名玩家（即总人数至少 4 人）！');
                }
                if (roomState.mode === 'offline' && roomState.players.length < 4) {
                  return alert('线下发牌模式下，除去法官外至少需要 3 名玩家（即总人数至少 4 人）！');
                }
                onSend('start_game', {
                  mode: roomState.mode,
                  categoryIds: roomState.categoryIds,
                  totalRounds: roomState.totalRounds,
                  ownerParticipates: roomState.mode === 'offline' ? false : roomState.ownerParticipates,
                  maxPlayers: roomState.maxPlayers
                });
              }}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              <Play className="w-5 h-5 fill-current" />
              开始游戏
            </button>
          </div>
        ) : (
          <div className="text-center py-4 bg-slate-950/40 rounded-xl border border-slate-900/60">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse mr-2"></span>
            <span className="text-xs text-gray-400 font-semibold">等待房主开启游戏...</span>
          </div>
        )}
      </div>
      
        {/* Return button */}
        <button
          onClick={() => {
            if (window.confirm('确定退出该房间吗？')) {
              onLeave();
            }
          }}
          className="text-xs text-gray-500 hover:text-gray-400 transition"
        >
          退出房间
        </button>

        {/* Room Creation Configuration Modal (for Lobby Wait Status) */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleCreateRoom} className="w-full max-w-md glass-card rounded-2xl p-6 border border-slate-800">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">修改房间配置</h3>
              </div>

              {/* Mode Selection */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">游戏模式</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateMode('online')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      createMode === 'online'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700'
                    }`}
                  >
                    线上模式 (系统流转)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode('offline')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      createMode === 'offline'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700'
                    }`}
                  >
                    线下模式 (联机发牌)
                  </button>
                </div>
              </div>

              {/* Rounds & Players */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">最大玩家数</label>
                  <input
                    type="number"
                    min="3"
                    max="12"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Math.max(3, Math.min(12, parseInt(e.target.value) || 8)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">比赛局数</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Owner role (only for online mode) */}
              {createMode === 'online' && (
                <div className="mb-4 bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>房主亲自参赛</span>
                      <ShieldAlert className="w-3 h-3 text-indigo-400" />
                    </div>
                    <div className="text-2xs text-gray-500 mt-0.5">关闭后房主充当法官，主持选词与指定先手</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={ownerParticipates}
                    onChange={(e) => setOwnerParticipates(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-700 bg-slate-900 rounded focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Choose Word Libraries */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">勾选游戏词库 (可多选)</label>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-2 bg-slate-900/40 border border-slate-900 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`lobby-edit-cat-${cat.id}`}
                          checked={selectedCats.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCats([...selectedCats, cat.id]);
                            } else {
                              setSelectedCats(selectedCats.filter(id => id !== cat.id));
                            }
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 bg-slate-900 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={`lobby-edit-cat-${cat.id}`} className="text-xs font-semibold text-gray-200">
                          {cat.name} ({cat.word_count}对)
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePreviewCategory(cat.id, cat.name)}
                        className="text-2xs text-gray-400 hover:text-indigo-400 flex items-center gap-0.5"
                      >
                        <Eye className="w-3 h-3" /> 预览
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={selectedCats.length === 0}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/25"
                >
                  确认修改
                </button>
              </div>
            </form>
          </div>
        )}
    </div>
  );
}
