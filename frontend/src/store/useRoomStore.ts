"use client";

import { create } from "zustand";
import type { RoomView } from "@/lib/socket";

type RoomStore = {
  room: RoomView | null;
  playerToken: string | null;
  myRole: string | null;
  playerName: string;
  setRoom: (room: RoomView | null) => void;
  setSession: (roomCode: string, playerToken: string, role: string) => void;
  setPlayerName: (name: string) => void;
  clear: () => void;
};

// Player tokens are persisted per room code so a page refresh (or dropped
// wifi on a school laptop) can rejoin the same seat instead of losing it.
function tokenKey(roomCode: string) {
  return `backbench:room:${roomCode}:token`;
}

export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  playerToken: null,
  myRole: null,
  playerName:
    typeof window !== "undefined" ? localStorage.getItem("backbench:name") || "" : "",

  setRoom: (room) => set({ room }),

  setSession: (roomCode, playerToken, role) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(tokenKey(roomCode), playerToken);
    }
    set({ playerToken, myRole: role });
  },

  setPlayerName: (name) => {
    if (typeof window !== "undefined") localStorage.setItem("backbench:name", name);
    set({ playerName: name });
  },

  clear: () => set({ room: null, playerToken: null, myRole: null }),
}));

export function getStoredToken(roomCode: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(tokenKey(roomCode));
}
