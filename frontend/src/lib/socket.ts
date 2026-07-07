"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// Single shared socket connection for the whole app. Created lazily so it
// only connects once the user actually needs realtime features.
export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    socket = io(url, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export type PlayerView = {
  name: string;
  role: string;
  connected: boolean;
  ready: boolean;
};

export type RoomView = {
  code: string;
  gameType: "tic-tac-toe" | "rock-paper-scissors";
  settings: Record<string, unknown>;
  status: "waiting" | "active" | "finished";
  state: any;
  players: PlayerView[];
};
