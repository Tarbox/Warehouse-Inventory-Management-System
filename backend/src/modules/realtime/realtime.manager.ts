import type { WebSocket } from "ws";

import type {
  RealtimeEvent,
} from "./realtime.types.js";

const clients = new Set<WebSocket>();

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

export function removeClient(
  socket: WebSocket,
) {
  clients.delete(socket);
}

export function broadcast(
  event: RealtimeEvent,
) {
  const message = JSON.stringify(event);

  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

export function getClientCount() {
  return clients.size;
}