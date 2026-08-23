"use client";

import {
  useEffect,
  useRef,
} from "react";

type InventoryUpdatedEvent = {
  type: "inventory.updated";

  payload: {
    materialId: number;
    quantity: number;
    version: number;
  };
};

type ConnectionReadyEvent = {
  type: "connection.ready";
};

type RealtimeEvent =
  | InventoryUpdatedEvent
  | ConnectionReadyEvent;

type UseInventoryRealtimeOptions = {
  onInventoryUpdated: (
    payload: InventoryUpdatedEvent["payload"],
  ) => void;
};

export function useInventoryRealtime({
  onInventoryUpdated,
}: UseInventoryRealtimeOptions) {
  const socketRef =
    useRef<WebSocket | null>(null);

  const reconnectTimerRef =
    useRef<
      ReturnType<typeof setTimeout> | null
    >(null);

  const reconnectAttemptRef =
    useRef(0);

  useEffect(() => {
    let closedByComponent = false;

    function connect() {
      if (closedByComponent) {
        return;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ??
        "http://localhost:4000";

      const wsUrl = apiUrl
        .replace(/^http/, "ws")
        .concat("/api/realtime");

      const socket =
        new WebSocket(wsUrl);

      socketRef.current = socket;

      socket.addEventListener(
        "open",
        () => {
          reconnectAttemptRef.current = 0;

          console.log(
            "Realtime connection established",
          );
        },
      );

      socket.addEventListener(
        "message",
        (event) => {
          try {
            const message =
              JSON.parse(
                event.data,
              ) as RealtimeEvent;

            if (
              message.type ===
              "inventory.updated"
            ) {
              onInventoryUpdated(
                message.payload,
              );
            }
          } catch (error) {
            console.error(
              "Invalid realtime message",
              error,
            );
          }
        },
      );

      socket.addEventListener(
        "close",
        () => {
          socketRef.current = null;

          if (closedByComponent) {
            return;
          }

          const attempt =
            reconnectAttemptRef.current;

          reconnectAttemptRef.current =
            attempt + 1;

          const delay = Math.min(
            1000 *
              2 ** attempt,
            10000,
          );

          reconnectTimerRef.current =
            setTimeout(
              connect,
              delay,
            );
        },
      );

      socket.addEventListener(
        "error",
        () => {
          socket.close();
        },
      );
    }

    connect();

    return () => {
      closedByComponent = true;

      if (
        reconnectTimerRef.current
      ) {
        clearTimeout(
          reconnectTimerRef.current,
        );
      }

      socketRef.current?.close();
    };
  }, [onInventoryUpdated]);
}