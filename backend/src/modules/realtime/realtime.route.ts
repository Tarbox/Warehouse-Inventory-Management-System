import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";

import authenticate from "../../plugins/authenticate.js";

import {
  addClient,
  removeClient,
} from "./realtime.manager.js";

// The function registers the realtime routes with the Fastify instance.
export async function realtimeRoutes(
  app: FastifyInstance,
) {
  // Register a new route for the "/realtime" endpoint.
  // The route is protected by the "authenticate" plugin.
  // The route accepts WebSocket connections and handles incoming messages.
  await app.register(async (protectedRoutes) => {
    await protectedRoutes.register(
      authenticate,
    );

    protectedRoutes.get(
      "/realtime",
      {// Enable WebSocket support for this route.
        websocket: true,
      },
      (socket, request) => {
        const client =
          socket as WebSocket;

        addClient(client);

        client.send(
          JSON.stringify({
            type: "connection.ready",
          }),
        )
// If the message is a "ping" message, respond with a "pong" message.
        client.on("message", (message) => {
          if (
            message.toString() === "ping"
          ) {
            client.send(
              JSON.stringify({
                type: "pong",
              }),
            );
          }
        });
// When the client disconnects, remove it from the list of clients and log the event.
        client.on("close", () => {
          removeClient(client);

          request.log.info(
            "Realtime client disconnected",
          );
        });
      },
    );
  });
}