import { io, type Socket } from "socket.io-client";

// une seule connexion socket pour toute l'app, créée au premier appel (donc seulement dans le navigateur)
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // pas d'URL : même origine que la page, nginx redirige /socket.io/ vers le back
    // autoConnect: false : la page qui en a besoin appelle socket.connect() elle-même
    socket = io({ autoConnect: false });
  }
  return socket;
}
