import { io } from "socket.io-client";

const socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL,
  {
    autoConnect: false,          // SocketProvider connects after curruser loads
    reconnection: true,          // auto-reconnect on drop
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,     // start at 1s
    reconnectionDelayMax: 10000, // cap at 10s
    transports: ["websocket", "polling"], // polling fallback if websocket is blocked
  }
);

export default socket;

