import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { sessionMiddleware } from "../middleware/session";
import { redisClient } from "./redis";
//import des outils
//midelware de session pour savoir qui se connecte

// on prépare une varibale pour le serveur socket.io
let io: SocketIOServer | null = null;

//cette fct reçoit le serveur HTTP
//ici qu on crée le serveur Socket.IO
//on ajoute le middleware de session (quand un client se connecte, Socket.IO peut accéder à sa session)
//"server.on.." : dans cette fct on attend qu u nclient se conecte
//"const userID =" : on récupère l id du client
// "socket.join" : on crée une room pour cet user
//await redisClient.sAdd("online_users", userId); : on dit à Redis que l'utilisateur est en ligne
//"server.emit" : on prévient tous les autres users qui s'est connecté
//"socket.emit" : on previent tous les autres users qui est en ligne
//... getIO() : la focntion qui permet de récupérer socket.IO deuis les routes pour émettre un event (ex. créer un message)

  export function initSocketServer(httpServer: HTTPServer) {
	const server = new SocketIOServer(httpServer, { cors: { origin: true, credentials: true } });
	io = server;
	server.engine.use(sessionMiddleware);
	redisClient.del("online_users").catch((error) => console.error("Failed to reset online users", error));
	//s'execute une fois, à la connexion d'un user
	server.on("connection", async (socket) => {
		const userId = (socket.request as any).session?.userId;
		if (!userId) {
			socket.disconnect();
			return;
		}
		//room
		socket.join(`user:${userId}`);
		await redisClient.sAdd("online_users", userId);
		//préviens tout le monde que cet user s' est connecté
		server.emit("user:online", userId);
		//envoie à ce nouvel onglet la liste de tous ceux qui sont déjà en ligne
		socket.emit("users:online", await redisClient.sMembers("online_users"));
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


export function getIO(): SocketIOServer {
	if (!io)
		throw new 
	("Socket.IO not initialized: call initSocketServer first");
	return io;
}

export async function isUserOnline(userId: string): Promise<boolean> {
	return redisClient.sIsMember("online_users", userId);
}