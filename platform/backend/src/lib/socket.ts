import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { sessionMiddleware } from "../middleware/session";
import { redisClient } from "./redis";

export function initSocketServer(httpServer: HTTPServer) {
	const io = new SocketIOServer(httpServer, { cors: { origin: true, credentials: true } });
	io.engine.use(sessionMiddleware);
	//s'execute une fois, à la connexion d'un user
	io.on("connection", async (socket) => {
		const userId = (socket.request as any).session?.userId;
		if (!userId) {
			socket.disconnect();
			return;
		}
		await redisClient.sAdd("online_users", userId);
		//préviens tout le monde que cet user s'est connecté
		io.emit("user:online", userId);
		//s'execute quand on perd la connexion avec l'user 
		socket.on("disconnect", async () => { 
			await redisClient.sRem("online_users", userId);
			io.emit("user:offline", userId);
		});
	});
	return io;
}

export async function isUserOnline(userId: string): Promise<boolean> {
	return redisClient.sIsMember("online_users", userId);
}