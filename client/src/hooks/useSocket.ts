import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameRoom, AckResponse } from '../shared';

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  // References to keep callbacks fresh
  const roomRef = useRef<GameRoom | null>(null);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    // Connect to VITE_SERVER_URL with fallback to localhost
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    const socketInstance = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionState('connected');
      setError(null);
      console.log('[useSocket] Socket connected.');

      // Auto-reconnect if we had an active room in memory/storage
      const storedRoomCode = sessionStorage.getItem('hc_room_code');
      const storedPlayerId = localStorage.getItem('hc_player_id');
      if (storedRoomCode && storedPlayerId) {
        socketInstance.emit(
          'reconnect-room',
          { roomCode: storedRoomCode, playerId: storedPlayerId },
          (res: AckResponse<{ room: GameRoom }>) => {
            if (res.success && res.data) {
              setRoom(res.data.room);
            } else {
              // Room expired during disconnection
              sessionStorage.removeItem('hc_room_code');
              setRoom(null);
            }
          }
        );
      }
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('[useSocket] Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server kicked us off, don't auto reconnect
        setConnectionState('disconnected');
      } else {
        setConnectionState('reconnecting');
      }
    });

    socketInstance.on('connect_error', () => {
      setConnectionState('reconnecting');
    });

    socketInstance.on('room-update', (updatedRoom: GameRoom) => {
      setRoom(updatedRoom);
    });

    // Custom forfeit event
    socketInstance.on('player-forfeited', (data: { winnerId: string; room: GameRoom }) => {
      setRoom(data.room);
    });

    // Delayed sync for reveal moves to allow client animation flow to complete first
    socketInstance.on('reveal-moves', (data: { updatedRoom: GameRoom }) => {
      setTimeout(() => {
        setRoom(data.updatedRoom);
      }, 4800);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  /**
   * Helper to perform socket emits with promised acknowledgements
   */
  const emitAck = <T = any>(event: string, payload: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('Socket is not connected'));
      }
      socket.emit(event, payload, (response: AckResponse<T>) => {
        if (response.success) {
          resolve(response.data as T);
        } else {
          reject(new Error(response.error || `Failed to execute ${event}`));
        }
      });
    });
  };

  const createRoom = async (playerId: string, nickname: string) => {
    try {
      const data = await emitAck<{ room: GameRoom }>('create-room', { playerId, nickname });
      setRoom(data.room);
      sessionStorage.setItem('hc_room_code', data.room.code);
      setError(null);
      return data.room;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const joinRoom = async (roomCode: string, playerId: string, nickname: string) => {
    try {
      const data = await emitAck<{ room: GameRoom }>('join-room', { roomCode, playerId, nickname });
      setRoom(data.room);
      sessionStorage.setItem('hc_room_code', data.room.code);
      setError(null);
      return data.room;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const setReady = async (roomCode: string, playerId: string, ready: boolean) => {
    try {
      await emitAck('ready', { roomCode, playerId, ready });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const startGame = async (roomCode: string, playerId: string) => {
    try {
      await emitAck('start-game', { roomCode, playerId });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const submitTossGuess = async (roomCode: string, playerId: string, prediction: 'heads' | 'tails') => {
    try {
      await emitAck('toss-guess', { roomCode, playerId, prediction });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const submitTossDecision = async (roomCode: string, playerId: string, choice: 'bat' | 'bowl') => {
    try {
      await emitAck('bat-bowl-choice', { roomCode, playerId, choice });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const submitMove = async (roomCode: string, playerId: string, choice: number) => {
    try {
      await emitAck('submit-move', { roomCode, playerId, choice });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const submitRematch = async (roomCode: string, playerId: string, accept: boolean) => {
    try {
      await emitAck('play-again', { roomCode, playerId, accept });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const startSecondInnings = async (roomCode: string, playerId: string) => {
    try {
      await emitAck('start-second-innings', { roomCode, playerId });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const leaveRoom = async (roomCode: string, playerId: string) => {
    try {
      await emitAck('leave-room', { roomCode, playerId });
      setRoom(null);
      sessionStorage.removeItem('hc_room_code');
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resetRoomState = () => {
    setRoom(null);
    sessionStorage.removeItem('hc_room_code');
  };

  return {
    socket,
    isConnected,
    connectionState,
    room,
    error,
    setError,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    submitTossGuess,
    submitTossDecision,
    submitMove,
    submitRematch,
    startSecondInnings,
    leaveRoom,
    resetRoomState,
  };
}
