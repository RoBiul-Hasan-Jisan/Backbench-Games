"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import type { AckResponse, ConnectionState, GameRoom } from "./types";

const ROOM_CODE_KEY = "backbench:hc:roomCode";

/**
 * Hand Cricket's realtime hook. Reuses the app-wide `getSocket()` singleton
 * (same connection Tic-Tac-Toe/RPS use) instead of opening a second socket,
 * since the backend now multiplexes both protocols over one Socket.IO server.
 */
export function useHandCricketSocket() {
  const socket = getSocket();
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    socket.connected ? "connected" : "disconnected"
  );
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roomRef = useRef<GameRoom | null>(null);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState("connected");
      setError(null);

      const storedRoomCode =
        typeof window !== "undefined" ? sessionStorage.getItem(ROOM_CODE_KEY) : null;
      const storedPlayerId = getStoredPlayerId();
      if (storedRoomCode && storedPlayerId) {
        socket.emit(
          "reconnect-room",
          { roomCode: storedRoomCode, playerId: storedPlayerId },
          (res: AckResponse<{ room: GameRoom }>) => {
            if (res.success && res.data) {
              setRoom(res.data.room);
            } else {
              sessionStorage.removeItem(ROOM_CODE_KEY);
              setRoom(null);
            }
          }
        );
      }
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      setConnectionState(reason === "io server disconnect" ? "disconnected" : "reconnecting");
    };

    const handleConnectError = () => setConnectionState("reconnecting");
    const handleRoomUpdate = (updatedRoom: GameRoom) => setRoom(updatedRoom);
    const handleForfeit = (data: { room: GameRoom }) => setRoom(data.room);
    const handleRevealMoves = (data: { updatedRoom: GameRoom }) => {
      setTimeout(() => setRoom(data.updatedRoom), 4800);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("room-update", handleRoomUpdate);
    socket.on("player-forfeited", handleForfeit);
    socket.on("reveal-moves", handleRevealMoves);

    if (socket.connected) {
      setIsConnected(true);
      setConnectionState("connected");
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("room-update", handleRoomUpdate);
      socket.off("player-forfeited", handleForfeit);
      socket.off("reveal-moves", handleRevealMoves);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emitAck = <T = any>(event: string, payload: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!socket.connected) return reject(new Error("Socket is not connected"));
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
      const data = await emitAck<{ room: GameRoom }>("create-room", { playerId, nickname });
      setRoom(data.room);
      if (typeof window !== "undefined") sessionStorage.setItem(ROOM_CODE_KEY, data.room.code);
      setError(null);
      return data.room;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const joinRoom = async (roomCode: string, playerId: string, nickname: string) => {
    try {
      const data = await emitAck<{ room: GameRoom }>("join-room", { roomCode, playerId, nickname });
      setRoom(data.room);
      if (typeof window !== "undefined") sessionStorage.setItem(ROOM_CODE_KEY, data.room.code);
      setError(null);
      return data.room;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const setReady = async (roomCode: string, playerId: string, ready: boolean) => {
    try {
      await emitAck("ready", { roomCode, playerId, ready });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const startGame = async (roomCode: string, playerId: string) => {
    try {
      await emitAck("start-game", { roomCode, playerId });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const submitTossGuess = async (roomCode: string, playerId: string, prediction: "heads" | "tails") => {
    try {
      await emitAck("toss-guess", { roomCode, playerId, prediction });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const submitTossDecision = async (roomCode: string, playerId: string, choice: "bat" | "bowl") => {
    try {
      await emitAck("bat-bowl-choice", { roomCode, playerId, choice });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const submitMove = async (roomCode: string, playerId: string, choice: number) => {
    try {
      await emitAck("submit-move", { roomCode, playerId, choice });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const submitRematch = async (roomCode: string, playerId: string, accept: boolean) => {
    try {
      await emitAck("play-again", { roomCode, playerId, accept });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const startSecondInnings = async (roomCode: string, playerId: string) => {
    try {
      await emitAck("start-second-innings", { roomCode, playerId });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const leaveRoom = async (roomCode: string, playerId: string) => {
    try {
      await emitAck("leave-room", { roomCode, playerId });
      setRoom(null);
      if (typeof window !== "undefined") sessionStorage.removeItem(ROOM_CODE_KEY);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resetRoomState = () => {
    setRoom(null);
    if (typeof window !== "undefined") sessionStorage.removeItem(ROOM_CODE_KEY);
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

const PLAYER_ID_KEY = "backbench:hc:playerId";
const NICKNAME_KEY = "backbench:hc:nickname";

export function getStoredPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAYER_ID_KEY);
}

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = window.crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getStoredHcNickname(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NICKNAME_KEY) || "";
}

export function storeHcNickname(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NICKNAME_KEY, name);
}
