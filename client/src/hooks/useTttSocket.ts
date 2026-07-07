import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { TttRoom, AckResponse } from '../shared';

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

export function useTttSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [room, setRoom] = useState<TttRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roomRef = useRef<TttRoom | null>(null);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
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

      const storedRoomCode = sessionStorage.getItem('ttt_room_code');
      const storedPlayerId = localStorage.getItem('hc_player_id');
      if (storedRoomCode && storedPlayerId) {
        socketInstance.emit(
          'ttt:reconnect-room',
          { roomCode: storedRoomCode, playerId: storedPlayerId },
          (res: AckResponse<{ room: TttRoom }>) => {
            if (res.success && res.data) {
              setRoom(res.data.room);
            } else {
              sessionStorage.removeItem('ttt_room_code');
              setRoom(null);
            }
          }
        );
      }
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        setConnectionState('disconnected');
      } else {
        setConnectionState('reconnecting');
      }
    });

    socketInstance.on('connect_error', () => {
      setConnectionState('reconnecting');
    });

    socketInstance.on('ttt:room-update', (updatedRoom: TttRoom) => {
      setRoom(updatedRoom);
    });

    socketInstance.on('ttt:player-forfeited', (data: { winnerId: string; room: TttRoom }) => {
      setRoom(data.room);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

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
      const data = await emitAck<{ room: TttRoom }>('ttt:create-room', { playerId, nickname });
      setRoom(data.room);
      sessionStorage.setItem('ttt_room_code', data.room.code);
      setError(null);
      return data.room;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const joinRoom = async (roomCode: string, playerId: string, nickname: string) => {
    try {
      const data = await emitAck<{ room: TttRoom }>('ttt:join-room', { roomCode, playerId, nickname });
      setRoom(data.room);
      sessionStorage.setItem('ttt_room_code', data.room.code);
      setError(null);
      return data.room;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const startGame = async (roomCode: string, playerId: string, boardSize: 3 | 5 | 8) => {
    try {
      await emitAck('ttt:start-game', { roomCode, playerId, boardSize });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const makeMove = async (roomCode: string, playerId: string, cellIndex: number) => {
    try {
      await emitAck('ttt:make-move', { roomCode, playerId, cellIndex });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const rematch = async (roomCode: string, playerId: string) => {
    try {
      await emitAck('ttt:rematch', { roomCode, playerId });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const leaveRoom = async (roomCode: string, playerId: string) => {
    try {
      await emitAck('ttt:leave-room', { roomCode, playerId });
      setRoom(null);
      sessionStorage.removeItem('ttt_room_code');
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resetRoomState = () => {
    setRoom(null);
    sessionStorage.removeItem('ttt_room_code');
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
    startGame,
    makeMove,
    rematch,
    leaveRoom,
    resetRoomState,
  };
}
