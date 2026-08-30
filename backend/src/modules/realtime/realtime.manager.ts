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

  socket.on("close", () => {
    clients.delete(socket);
  });

  socket.on("error", () => {
    clients.delete(socket);
  });
}

// The function removes a WebSocket connection from the list of clients.
export function removeClient(
  socket: WebSocket,
) {
  clients.delete(socket);
}

// The function broadcasts a RealtimeEvent to all connected WebSocket clients.
export function broadcast(
  event: RealtimeEvent,
) {
  // Convert the event to a JSON string.
  const message = JSON.stringify(event);

// Send the message to all connected clients.
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