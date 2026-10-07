import { io, type Socket } from "socket.io-client";

//one socket for the whole app, created on first call (so browser only)
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    //no URL: same origin as the page, nginx forwards /socket.io/ to the back
    //autoConnect: false, whoever needs it calls socket.connect() themselves
    socket = io({ autoConnect: false });
  }
  return socket;
}
