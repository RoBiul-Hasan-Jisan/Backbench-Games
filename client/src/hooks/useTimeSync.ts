import { useEffect, useRef } from 'react';

export function useTimeSync(socket: any) {
  const offsetRef = useRef<number>(0);
  const syncIntervalRef = useRef<any>(null);

  const performSync = () => {
    if (!socket || !socket.connected) return;

    const clientSendTime = Date.now();
    socket.emit('ping-sync', { clientTime: clientSendTime });
  };

  useEffect(() => {
    if (!socket) return;

    const handlePong = (data: { clientTime: number; serverTime: number }) => {
      const clientReceiveTime = Date.now();
      // Round trip time (RTT)
      const rtt = clientReceiveTime - data.clientTime;
      // Estimate server time at the moment of receive: serverTime + (rtt / 2)
      const estimatedServerTime = data.serverTime + rtt / 2;
      // Offset: estimatedServerTime - clientReceiveTime
      const offset = estimatedServerTime - clientReceiveTime;

      offsetRef.current = offset;
      console.log(`[TimeSync] RTT: ${rtt}ms, Server Offset: ${offset}ms`);
    };

    socket.on('pong-sync', handlePong);

    // Sync on connection and then on interval
    if (socket.connected) {
      performSync();
    }

    const onConnect = () => {
      performSync();
    };

    socket.on('connect', onConnect);

    // Run every 30 seconds
    syncIntervalRef.current = setInterval(performSync, 30000);

    return () => {
      socket.off('pong-sync', handlePong);
      socket.off('connect', onConnect);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [socket]);

  /**
   * Returns current server epoch time in milliseconds
   */
  const getServerTime = (): number => {
    return Date.now() + offsetRef.current;
  };

  return {
    getServerTime,
    offset: offsetRef.current,
  };
}
