import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { Scoreboard } from './components/Scoreboard';
import { Contribute } from './components/Contribute';

// Retrieve or generate temporary unique playerId for the client
const getPlayerId = (nickname: string): string => {
  if (!nickname) return '';
  let pid = sessionStorage.getItem('whois_player_id');
  if (!pid || !pid.startsWith('p_' + encodeURIComponent(nickname) + '_')) {
    pid = 'p_' + encodeURIComponent(nickname) + '_' + Math.floor(Math.random() * 1000000).toString(36) + '_' + Date.now().toString(36).slice(-4);
    sessionStorage.setItem('whois_player_id', pid);
  }
  return pid;
};

const getStoredNickname = (): string => {
  return sessionStorage.getItem('whois_nickname') || '';
};

export default function App() {
  const [nickname, setNicknameState] = useState<string>(getStoredNickname);
  const [playerId, setPlayerId] = useState<string>(() => getPlayerId(nickname));
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeNickname, setActiveNickname] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'game' | 'contribute'>('game');

  // Handle nickname persistence
  const setNickname = (val: string) => {
    setNicknameState(val);
    sessionStorage.setItem('whois_nickname', val);
    const newPid = getPlayerId(val);
    setPlayerId(newPid);
  };

  // Sync Room ID from URL Hash on mount (allows sharing links!)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/room/')) {
      const rId = hash.replace('#/room/', '');
      if (rId && rId.trim() && nickname.trim()) {
        setActiveRoomId(rId.trim());
        setActiveNickname(nickname.trim());
      }
    }
  }, []);

  // Update hash when room changes
  useEffect(() => {
    if (activeRoomId) {
      window.location.hash = `#/room/${activeRoomId}`;
    } else {
      window.location.hash = '';
    }
  }, [activeRoomId]);

  // Hook into WebSocket
  const {
    roomState,
    yourWord,
    refereeWordOptions,
    chatMessages,
    errorMsg,
    send
  } = useWebSocket(activeRoomId, activeNickname, playerId);

  const handleJoinRoom = (rId: string, name: string) => {
    setActiveRoomId(rId);
    setActiveNickname(name);
  };

  const handleLeaveRoom = () => {
    send('leave_room', {});
    setActiveRoomId(null);
    setActiveNickname(null);
  };

  if (currentView === 'contribute') {
    return <Contribute onBack={() => setCurrentView('game')} />;
  }

  // Handle Error View
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#050811] text-gray-200 flex flex-col items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-6 max-w-sm text-center border border-red-900/40">
          <div className="text-red-500 text-3xl mb-2 font-black">连接异常</div>
          <p className="text-xs text-gray-400 mb-4">{errorMsg}</p>
          <button
            onClick={() => {
              sessionStorage.removeItem('whois_player_id');
              window.location.reload();
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
          >
            重试并重置状态
          </button>
        </div>
      </div>
    );
  }

  // 1. Lobby View (Not in game or in lobby status)
  if (!roomState || roomState.status === 'lobby') {
    return (
      <Lobby
        roomState={roomState}
        nickname={nickname}
        setNickname={setNickname}
        roomId={activeRoomId || ''}
        setRoomId={setActiveRoomId}
        playerId={playerId}
        onJoin={handleJoinRoom}
        onSend={send}
        onNavigateToContribute={() => setCurrentView('contribute')}
        onLeave={handleLeaveRoom}
      />
    );
  }

  // 2. Scoreboard View (Game round ended)
  if (roomState.status === 'ended') {
    return (
      <Scoreboard
        roomState={roomState}
        playerId={playerId}
        onSend={send}
        onLeave={handleLeaveRoom}
      />
    );
  }

  // 3. Gameplay View
  return (
    <GameBoard
      roomState={roomState}
      playerId={playerId}
      yourWord={yourWord}
      refereeWordOptions={refereeWordOptions}
      chatMessages={chatMessages}
      onSend={send}
      onLeave={handleLeaveRoom}
    />
  );
}
