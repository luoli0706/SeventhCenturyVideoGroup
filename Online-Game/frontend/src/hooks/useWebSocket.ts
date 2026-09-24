import { useEffect, useRef, useState, useCallback } from 'react';
import type { RoomState, WsMessage } from '../../../backend/src/types';
import { WS_PATH } from '../config';

export interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface YourWord {
  word: string;
  role?: 'civilian' | 'undercover';
}

export interface RefereeWordOption {
  id: number;
  word_a: string;
  word_b: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function useWebSocket(roomId: string | null, nickname: string | null, playerId: string) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [yourWord, setYourWord] = useState<YourWord | null>(null);
  const [refereeWordOptions, setRefereeWordOptions] = useState<RefereeWordOption[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isManuallyClosed = useRef<boolean>(false);

  const connect = useCallback(() => {
    if (!roomId || !nickname) return;

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnectionStatus('connecting');
    isManuallyClosed.current = false;

    // Use current browser host, Vite proxy will map /ws to 17712 port automatically
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const host = window.location.host;
    const wsUrl = `${protocol}${host}${WS_PATH}`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      setConnectionStatus('connected');
      setErrorMsg(null);

      // Join room immediately upon connection
      send('join_room', { roomId, nickname, playerId });
    };

    socket.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        const { type, payload } = msg;

        switch (type) {
          case 'room_state':
            setRoomState(payload);
            break;
          case 'your_word':
            setYourWord(payload);
            break;
          case 'referee_word_options':
            setRefereeWordOptions(payload);
            break;
          case 'chat_message':
            setChatMessages((prev) => [
              ...prev,
              {
                senderId: payload.senderId,
                senderName: payload.senderName,
                text: payload.text,
                timestamp: Date.now(),
              },
            ]);
            break;
          case 'reveal_words':
            // The roomState broadcast will carry the new revealedWords,
            // but we can trigger a short alert or localized display from this event
            break;
          case 'left_room':
            setRoomState(null);
            setYourWord(null);
            setRefereeWordOptions([]);
            setChatMessages([]);
            break;
          case 'error':
            setErrorMsg(payload.message || 'An error occurred');
            break;
          default:
            console.log('Unknown message type:', type);
        }
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnectionStatus('disconnected');
      setYourWord(null);
      setRefereeWordOptions([]);

      // Auto-reconnect if not closed manually
      if (!isManuallyClosed.current) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 2000);
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket error occurred:', err);
      socket.close();
    };
  }, [roomId, nickname, playerId]);

  const disconnect = useCallback(() => {
    isManuallyClosed.current = true;
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setRoomState(null);
    setYourWord(null);
    setRefereeWordOptions([]);
    setChatMessages([]);
    setConnectionStatus('disconnected');
  }, []);

  const send = useCallback((type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('Cannot send message, WebSocket is not open');
    }
  }, []);

  useEffect(() => {
    if (roomId && nickname) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [roomId, nickname, connect, disconnect]);

  // Reset chat messages when game returns to lobby
  useEffect(() => {
    if (roomState?.status === 'lobby') {
      setChatMessages([]);
      setYourWord(null);
    }
  }, [roomState?.status]);

  return {
    roomState,
    yourWord,
    refereeWordOptions,
    chatMessages,
    connectionStatus,
    errorMsg,
    send,
  };
}
