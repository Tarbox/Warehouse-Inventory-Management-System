export type InventoryUpdatedEvent = {
  type: "inventory.updated";

  payload: {
    materialId: number;
    quantity: number;
    version: number;
  };
};

export type RealtimeEvent =
  | InventoryUpdatedEvent;