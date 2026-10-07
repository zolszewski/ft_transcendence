import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { sessionMiddleware } from "../middleware/session";
import { redisClient } from "./redis";

//set by initSocketServer
let io: SocketIOServer | null = null;

//hooks socket.io onto the HTTP server: session auth, one room per user, online list in Redis

  export function initSocketServer(httpServer: HTTPServer) {
	const server = new SocketIOServer(httpServer, { cors: { origin: true, credentials: true } });
	io = server;
	server.engine.use(sessionMiddleware);
	redisClient.del("online_users").catch((error) => console.error("Failed to reset online users", error));
	//runs once per new connection
	server.on("connection", async (socket) => {
		const userId = (socket.request as any).session?.userId;
		if (!userId) {
			socket.disconnect();
			return;
		}
		//one room per user (covers all their tabs)
		socket.join(`user:${userId}`);
		//kept so we can kill this session's sockets on logout
		socket.data.sessionId = (socket.request as any).sessionID;
		await redisClient.sAdd("online_users", userId);
		//tell everyone this user is online
		server.emit("user:online", userId);
		//send this new tab the list of who's already online
		socket.emit("users:online", await redisClient.sMembers("online_users"));
		//connection lost
		socket.on("disconnect", async () => {
			//they might still have other tabs open, only offline once the room is empty
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

//on logout: kill this session's sockets (the user's other sessions stay up)
//otherwise they keep the old identity and the user looks online forever
//the disconnect handler above then cleans up online_users
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