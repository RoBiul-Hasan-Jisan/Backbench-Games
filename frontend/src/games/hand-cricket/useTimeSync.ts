"use client";

import { useEffect, useRef } from "react";

export function useTimeSync(socket: any) {
  const offsetRef = useRef<number>(0);
  const syncIntervalRef = useRef<any>(null);

  const performSync = () => {
    if (!socket || !socket.connected) return;
    const clientSendTime = Date.now();
    socket.emit("ping-sync", { clientTime: clientSendTime });
  };

  useEffect(() => {
    if (!socket) return;

    const handlePong = (data: { clientTime: number; serverTime: number }) => {
      const clientReceiveTime = Date.now();
      const rtt = clientReceiveTime - data.clientTime;
      const estimatedServerTime = data.serverTime + rtt / 2;
      const offset = estimatedServerTime - clientReceiveTime;
      offsetRef.current = offset;
    };

    socket.on("pong-sync", handlePong);

    if (socket.connected) {
      performSync();
    }

    const onConnect = () => {
      performSync();
    };

    socket.on("connect", onConnect);

    syncIntervalRef.current = setInterval(performSync, 30000);

    return () => {
      socket.off("pong-sync", handlePong);
      socket.off("connect", onConnect);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const getServerTime = (): number => {
    return Date.now() + offsetRef.current;
  };

  return {
    getServerTime,
    offset: offsetRef.current,
  };
}
