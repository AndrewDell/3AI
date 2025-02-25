import { useEffect, useRef } from 'react';
import { io, Socket as ClientSocket } from 'socket.io-client';

interface ServerToClientEvents {
  metrics: (data: { data: { metrics: any } }) => void;
  agent_event: (event: { type: string; data: any }) => void;
}

interface ClientToServerEvents {
  command: (message: { command: string }) => void;
}

type SocketClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(url: string) {
  const socketRef = useRef<SocketClient | null>(null);

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(url);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url]);

  return socketRef.current;
} 