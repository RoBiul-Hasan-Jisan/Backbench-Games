"use client";

import { useEffect, useRef, useState } from "react";
import { HandCricketEngine, HUMAN_ID, BOT_ID, cloneRoom, createInitialRoom, pickBotMove } from "./botEngine";
import type { GameRoom } from "./types";

/**
 * Minimal event emitter that mimics the subset of the socket.io-client API
 * GameScreen relies on (`on` / `off`). Nothing here ever touches the network.
 */
class MiniEmitter {
  private listeners: Record<string, Set<(...args: any[]) => void>> = {};

  on(event: string, cb: (...args: any[]) => void) {
    (this.listeners[event] ||= new Set()).add(cb);
  }
  off(event: string, cb: (...args: any[]) => void) {
    this.listeners[event]?.delete(cb);
  }
  emit(event: string, ...args: any[]) {
    this.listeners[event]?.forEach((cb) => cb(...args));
  }
}

/**
 * Drives a full Hand Cricket match locally against a bot opponent, using the
 * exact same rules engine as the real server (see botEngine.ts). Exposes an
 * API shaped like useHandCricketSocket() so the existing Toss / GameScreen /
 * Results components can be reused without modification.
 */
export function useHandCricketPractice() {
  const [room, setRoomState] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef(new MiniEmitter());
  const pendingRoomRef = useRef<GameRoom | null>(null);
  const historyRef = useRef<number[]>([]);
  const thinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botActionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pendingRoomRef.current = room;
  }, [room]);

  // Clean up any in-flight timers on unmount.
  useEffect(() => {
    return () => {
      if (thinkTimerRef.current) clearTimeout(thinkTimerRef.current);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      if (botActionTimerRef.current) clearTimeout(botActionTimerRef.current);
    };
  }, []);

  // Autonomous bot actions: toss guess, bat/bowl decision, rematch accept.
  useEffect(() => {
    if (botActionTimerRef.current) {
      clearTimeout(botActionTimerRef.current);
      botActionTimerRef.current = null;
    }
    if (!room) return;

    if (room.status === "TOSS" && !room.coinFlipResult) {
      botActionTimerRef.current = setTimeout(() => {
        setRoomState((prev) => {
          if (!prev) return prev;
          const next = cloneRoom(prev);
          try {
            HandCricketEngine.handleCoinToss(next, Math.random() < 0.5 ? "heads" : "tails");
          } catch {
            return prev;
          }
          return next;
        });
      }, 900 + Math.random() * 500);
      return;
    }

    if (room.status === "BAT_OR_BOWL" && room.tossWinnerId === BOT_ID) {
      botActionTimerRef.current = setTimeout(() => {
        setRoomState((prev) => {
          if (!prev) return prev;
          const next = cloneRoom(prev);
          try {
            HandCricketEngine.handleTossDecision(next, BOT_ID, Math.random() < 0.5 ? "bat" : "bowl");
          } catch {
            return prev;
          }
          return next;
        });
      }, 1000 + Math.random() * 600);
      return;
    }

    if (room.status === "REMATCH") {
      const bot = room.players.find((p) => p.id === BOT_ID);
      if (bot && bot.playAgain === null) {
        botActionTimerRef.current = setTimeout(() => {
          setRoomState((prev) => {
            if (!prev) return prev;
            const next = cloneRoom(prev);
            try {
              HandCricketEngine.handlePlayAgain(next, BOT_ID, true);
            } catch {
              return prev;
            }
            return next;
          });
        }, 700 + Math.random() * 500);
      }
    }
  }, [room]);

  const startPractice = (nickname: string) => {
    historyRef.current = [];
    const initial = createInitialRoom(nickname);
    pendingRoomRef.current = initial;
    setRoomState(initial);
    setError(null);
  };

  const resetPractice = () => {
    if (thinkTimerRef.current) clearTimeout(thinkTimerRef.current);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    if (botActionTimerRef.current) clearTimeout(botActionTimerRef.current);
    pendingRoomRef.current = null;
    setRoomState(null);
    setError(null);
  };

  const submitTossDecision = (choice: "bat" | "bowl") => {
    setRoomState((prev) => {
      if (!prev) return prev;
      const next = cloneRoom(prev);
      try {
        HandCricketEngine.handleTossDecision(next, HUMAN_ID, choice);
      } catch (e: any) {
        setError(e.message);
        return prev;
      }
      return next;
    });
  };

  const submitMove = (choice: number) => {
    const base = pendingRoomRef.current;
    if (!base) return;
    if (base.status !== "FIRST_INNINGS" && base.status !== "SECOND_INNINGS") return;
    const human = base.players.find((p) => p.id === HUMAN_ID);
    if (human?.currentChoice !== null) return; // already submitted this delivery

    const working = cloneRoom(base);
    try {
      HandCricketEngine.submitChoice(working, HUMAN_ID, choice);
    } catch (e: any) {
      setError(e.message);
      return;
    }
    historyRef.current.push(choice);
    pendingRoomRef.current = working;

    const thinkMs = 350 + Math.random() * 550;
    thinkTimerRef.current = setTimeout(() => {
      const botChoice = pickBotMove(working, historyRef.current);
      let resolved = false;
      let revealTime: number | undefined;
      try {
        const res = HandCricketEngine.submitChoice(working, BOT_ID, botChoice);
        resolved = res.resolved;
        revealTime = res.revealTime;
      } catch (e: any) {
        setError(e.message);
        return;
      }
      if (!resolved || revealTime === undefined) return;

      const choiceSnapshot = working.players.map((p) => ({ id: p.id, choice: p.currentChoice as number }));
      let turnResult;
      try {
        turnResult = HandCricketEngine.resolveTurn(working);
      } catch (e: any) {
        setError(e.message);
        return;
      }

      socketRef.current.emit("reveal-moves", {
        revealTime,
        choices: choiceSnapshot,
        turnResult,
        updatedRoom: cloneRoom(working),
      });

      pendingRoomRef.current = working;
      revealTimerRef.current = setTimeout(() => {
        setRoomState(cloneRoom(working));
      }, 4800);
    }, thinkMs);
  };

  const startSecondInnings = () => {
    setRoomState((prev) => {
      if (!prev) return prev;
      const next = cloneRoom(prev);
      try {
        HandCricketEngine.startSecondInnings(next);
      } catch (e: any) {
        setError(e.message);
        return prev;
      }
      return next;
    });
  };

  const submitRematch = (accept: boolean) => {
    setRoomState((prev) => {
      if (!prev) return prev;
      const next = cloneRoom(prev);
      try {
        HandCricketEngine.handlePlayAgain(next, HUMAN_ID, accept);
      } catch (e: any) {
        setError(e.message);
        return prev;
      }
      return next;
    });
  };

  return {
    socket: socketRef.current,
    getServerTime: () => Date.now(),
    room,
    error,
    setError,
    startPractice,
    resetPractice,
    submitTossDecision,
    submitMove,
    startSecondInnings,
    submitRematch,
  };
}
