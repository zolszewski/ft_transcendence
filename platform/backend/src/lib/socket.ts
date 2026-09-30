import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { sessionMiddleware } from "../middleware/session";
import { redisClient } from "./redis";

// instance unique, créée au démarrage par initSocketServer, lue ensuite par les routes via getIO()
let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer) {
	const server = new SocketIOServer(httpServer, { cors: { origin: true, credentials: true } });
	io = server;
	server.engine.use(sessionMiddleware);
	//s'execute une fois, à la connexion d'un user
	server.on("connection", async (socket) => {
		const userId = (socket.request as any).session?.userId;
		if (!userId) {
			socket.disconnect();
			return;
		}
		//room perso : regroupe tous les onglets de cet user, pour lui envoyer des events avec .to(`user:${userId}`)
		socket.join(`user:${userId}`);
		await redisClient.sAdd("online_users", userId);
		//préviens tout le monde que cet user s'est connecté
		server.emit("user:online", userId);
		//s'execute quand on perd la connexion avec l'user 
		socket.on("disconnect", async () => {
			//l'user a peut-être encore d'autres onglets ouverts : il n'est hors ligne que si sa room est vide
			const remainingSockets = await server.in(`user:${userId}`).fetchSockets();
			if (remainingSockets.length > 0)
				return;
			await redisClient.sRem("online_users", userId);
			server.emit("user:offline", userId);
		});
	});
	return server;
}

// à utiliser dans les routes pour émettre un événement (ex: nouveau message)
export function getIO(): SocketIOServer {
	if (!io)
		throw new Error("Socket.IO not initialized: call initSocketServer first");
	return io;
}

export async function isUserOnline(userId: string): Promise<boolean> {
	return redisClient.sIsMember("online_users", userId);
}