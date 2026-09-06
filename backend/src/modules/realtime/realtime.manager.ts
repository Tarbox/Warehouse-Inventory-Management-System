import type { WebSocket } from "ws";
// Import the RealtimeEvent type from the realtime.types.ts file.
import type {
  RealtimeEvent,
} from "./realtime.types.js";

// list of all connected WebSocket clients.
const clients = new Set<WebSocket>();

// The function accepts a new WebSocket connection.
export function addClient(
  socket: WebSocket,
) {
  clients.add(socket);

  console.log(
    "Realtime client connected. Total:",
    clients.size,
  );

  socket.on("close", () => {
    clients.delete(socket);

    console.log(
      "Realtime client disconnected. Total:",
      clients.size,
    );
  });

  socket.on("error", () => {
    clients.delete(socket);

    console.log(
      "Realtime client error. Total:",
      clients.size,
    );
  });
}
export function removeClient(
  socket: WebSocket,
) {
  clients.delete(socket);
}

// The function removes a WebSocket connection from the list of clients.
export function broadcast(
  event: RealtimeEvent,
) {
  const message = JSON.stringify(event);

  console.log(
    "Broadcasting realtime event:",
    event.type,
    "connected clients:",
    clients.size,
  );

  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

// The function returns the number of currently connected WebSocket clients.
export function getClientCount() {
  return clients.size;
}