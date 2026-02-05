import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useStore } from './Store';
import config from '../utils/config';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useStore();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user && user.token) {
            // Initialize Socket
            // Query params: sapid and role for room joining
            const newSocket = io(config.API_URL, {
                query: {
                    sapid: user.sapid,
                    role: user.role
                }
            });

            newSocket.on('connect', () => {
                console.log('[Socket] Connected:', newSocket.id);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else if (socket) {
            socket.disconnect();
            setSocket(null);
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
