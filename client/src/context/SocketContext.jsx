import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);
export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  useEffect(() => {
    if (!token || !user) { setSocket(null); setOnlineUsers([]); return; }
    const origin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    const connection = io(origin, { auth: { token }, transports: ['websocket', 'polling'] });
    connection.on('presence:snapshot', setOnlineUsers);
    connection.on('presence:update', ({ userId, online }) => setOnlineUsers((current) => online ? [...new Set([...current, userId])] : current.filter((id) => id !== userId)));
    setSocket(connection);
    return () => { connection.disconnect(); setSocket(null); };
  }, [token, user?._id]);
  const value = useMemo(() => ({ socket, onlineUsers }), [socket, onlineUsers]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
