// useSocket.js
import { useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const useSocket = (event:any, callback:any) => {
  useEffect(() => {
    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [event, callback]);
};

export default useSocket;
