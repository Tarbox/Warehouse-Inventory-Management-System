import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";

import authenticate from "../../plugins/authenticate.js";

import {
  addClient,
  removeClient,
} from "./realtime.manager.js";

export async function realtimeRoutes(
  app: FastifyInstance,
) {
  await app.register(async (protectedRoutes) => {
    await protectedRoutes.register(
      authenticate,
    );

    protectedRoutes.get(
      "/realtime",
      {
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
        );

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