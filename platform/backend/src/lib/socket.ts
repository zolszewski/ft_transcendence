import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { sessionMiddleware } from "../middleware/session";
import { redisClient } from "./redis";
// Imports
// Session middleware: tells us which user is connecting

// Prepare a variable for the socket.io server
let io: SocketIOServer | null = null;

// This function receives the HTTP server.
// The Socket.IO server is created here.
// The session middleware is added (when a client connects, Socket.IO can access its session).
// "server.on..": this function waits for a client to connect.
// "const userID =": we get the client's id.
// "socket.join": we create a room for this user.
// await redisClient.sAdd("online_users", userId); : we tell Redis that the user is online.
// "server.emit": we notify all users that this user connected.
// "socket.emit": we tell the new tab who is already online.
// ... getIO(): the function that gives the routes access to Socket.IO, to emit an event (e.g. to notify a user).

  export function initSocketServer(httpServer: HTTPServer) {
	const server = new SocketIOServer(httpServer, { cors: { origin: true, credentials: true } });
	io = server;
	server.engine.use(sessionMiddleware);
	redisClient.del("online_users").catch((error) => console.error("Failed to reset online users", error));
	// runs once, when a user connects
	server.on("connection", async (socket) => {
		const userId = (socket.request as any).session?.userId;
		if (!userId) {
			socket.disconnect();
			return;
		}
		//room
		socket.join(`user:${userId}`);
		// kept so the sockets of this session can be closed on logout
		socket.data.sessionId = (socket.request as any).sessionID;
		await redisClient.sAdd("online_users", userId);
		// tell everyone that this user has connected
		server.emit("user:online", userId);
		// send this new tab the list of users already online
		socket.emit("users:online", await redisClient.sMembers("online_users"));
		// runs when the connection with the user is lost
		socket.on("disconnect", async () => {
			// the user may still have other tabs open: they are offline only when their room is empty
			const remainingSockets = await server.in(`user:${userId}`).fetchSockets();
			if (remainingSockets.length > 0)
				return;
			await redisClient.sRem("online_users", userId);
			server.emit("user:offline", userId);
		});
	});
	return server;
}


export function getIO(): SocketIOServer {
	if (!io)
		throw new Error("Socket.IO not initialized: call initSocketServer first");
	return io;
}

// On logout: closes the sockets opened with this session (other sessions of the same user stay connected).
// Otherwise they keep the previous user's identity, and that user would still appear online.
// The "disconnect" handler above then updates online_users.
export async function disconnectSessionSockets(userId: string, sessionId: string) {
	if (!io)
		return;
	const sockets = await io.in(`user:${userId}`).fetchSockets();
	for (const socket of sockets)
		if (socket.data.sessionId === sessionId)
			socket.disconnect(true);
}

export async function isUserOnline(userId: string): Promise<boolean> {
	return redisClient.sIsMember("online_users", userId);
}