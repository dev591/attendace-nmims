import { Server } from 'socket.io';

class SocketService {
    constructor() {
        this.io = null;
    }

    init(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`[SocketService] New Client: ${socket.id}`);

            // Join Room based on Role/ID if provided in query
            const { sapid, role } = socket.handshake.query;

            if (sapid) {
                console.log(`[SocketService] Client ${socket.id} joined room: user:${sapid}`);
                socket.join(`user:${sapid}`);
            }

            if (role) {
                console.log(`[SocketService] Client ${socket.id} joined room: role:${role}`);
                socket.join(`role:${role}`);
            }

            // Global/Broadcast Room
            socket.join('all');

            socket.on('disconnect', () => {
                console.log(`[SocketService] Client Disconnected: ${socket.id}`);
            });
        });

        console.log('[SocketService] Initialized!');
    }

    /**
     * Send event to specific user (by SAPID)
     * @param {string} sapid 
     * @param {string} event 
     * @param {any} data 
     */
    emitToUser(sapid, event, data) {
        if (!this.io) return;
        this.io.to(`user:${sapid}`).emit(event, data);
    }

    /**
     * Broadcast to everyone
     * @param {string} event 
     * @param {any} data 
     */
    broadcast(event, data) {
        if (!this.io) return;
        this.io.emit(event, data);
    }

    /**
     * Emit to specific role group
     * @param {string} role 
     * @param {string} event 
     * @param {any} data 
     */
    emitToRole(role, event, data) {
        if (!this.io) return;
        this.io.to(`role:${role}`).emit(event, data);
    }
}

export const socketService = new SocketService();
