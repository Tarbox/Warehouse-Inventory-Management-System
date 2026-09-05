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

// The `RealtimeEvent` type represents the different types of events that can be received from the WebSocket connection. It can either be an `InventoryUpdatedEvent` or a `ConnectionReadyEvent`.
type RealtimeEvent =
  | InventoryUpdatedEvent
  | ConnectionReadyEvent;

// The `useInventoryRealtime` hook establishes a WebSocket connection to the backend for receiving real-time inventory updates. It handles automatic reconnection with exponential backoff in case of disconnections.
type UseInventoryRealtimeOptions = {
  onInventoryUpdated: (
    payload: InventoryUpdatedEvent["payload"],
  ) => void;
};

// The `useInventoryRealtime` hook establishes a WebSocket connection to the backend for receiving real-time inventory updates. It handles automatic reconnection with exponential backoff in case of disconnections.
// It takes an `onInventoryUpdated` callback function as an option, which is called whenever an inventory update event is received from the server.
export function useInventoryRealtime({
  onInventoryUpdated,
}: UseInventoryRealtimeOptions) {
  const socketRef =
    useRef<WebSocket | null>(null);

// The `reconnectTimerRef` is a reference to the timer used for scheduling reconnection attempts. It is initialized to `null` and will hold the ID of the timer when a reconnection attempt is scheduled.
  const reconnectTimerRef =
    useRef<
      ReturnType<typeof setTimeout> | null
    >(null);

// The `reconnectAttemptRef` is a reference to the number of reconnection attempts made. It is initialized to `0` and will be incremented with each failed connection attempt, allowing for exponential backoff in reconnection timing.
  const reconnectAttemptRef =
    useRef(0);

  useEffect(() => {
    let closedByComponent = false;

    function connect() {
      if (closedByComponent) {
        return;
      }
// The `protocol` variable determines the appropriate WebSocket protocol to use based on the current page's protocol. If the page is served over HTTPS, it uses "wss:" (WebSocket Secure), otherwise it uses "ws:" (WebSocket).
// The `wsUrl` variable constructs the full WebSocket URL by combining the protocol, the current host, and the path to the WebSocket endpoint ("/api/realtime").
// The `socket` variable creates a new WebSocket connection to the constructed URL, and the `socketRef` is updated to hold this new WebSocket instance.
      const protocol =
        window.location.protocol === "https:" ? "wss:" : "ws:";

      const wsUrl =
        `${protocol}//${window.location.host}/api/realtime`;

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

// The `message` event listener is set up to handle incoming messages from the WebSocket connection. When a message is received, it attempts to parse the message data as JSON and checks if it is an `InventoryUpdatedEvent`. If it is, the `onInventoryUpdated` callback is called with the event's payload. If the message cannot be parsed or is not of the expected type, an error is logged to the console.
// The `close` event listener is set up to handle the WebSocket connection being closed. If the closure was not initiated by the component (i.e., `closedByComponent` is false), it schedules a reconnection attempt using an exponential backoff strategy. The delay for the next reconnection attempt is calculated based on the number of previous attempts, with a maximum delay of 10 seconds.
// The `error` event listener is set up to handle any errors that occur on the WebSocket connection. If an error occurs, the WebSocket connection is closed, which will trigger the `close` event listener to handle reconnection if necessary.
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

// The `close` event listener is set up to handle the WebSocket connection being closed. If the closure was not initiated by the component (i.e., `closedByComponent` is false), it schedules a reconnection attempt using an exponential backoff strategy. The delay for the next reconnection attempt is calculated based on the number of previous attempts, with a maximum delay of 10 seconds.
// The `reconnectAttemptRef` is incremented with each failed connection attempt, allowing for the exponential backoff calculation. If the closure was initiated by the component, no reconnection attempt is made.
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

// The cleanup function returned by the `useEffect` hook is responsible for closing the WebSocket connection and clearing any scheduled reconnection attempts when the component using this hook is unmounted. It sets the `closedByComponent` flag to true to indicate that the closure was initiated by the component, preventing any further reconnection attempts. If there is a scheduled reconnection attempt, it clears the timer to prevent it from executing after the component has been unmounted. Finally, it closes the WebSocket connection if it is still open.
// This ensures that the WebSocket connection is properly cleaned up and does not continue to run or attempt to reconnect after the component has been removed from the DOM.
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