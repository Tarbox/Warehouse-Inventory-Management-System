export type InventoryUpdatedEvent = {
  type: "inventory.updated";

  payload: {
    materialId: number;
    quantity: number;
    version: number;
  };
};

export type MaterialCreatedEvent = {
  type: "material.created";

  payload: {
    materialId: number;
  };
};

export type MaterialDeletedEvent = {
  type: "material.deleted";

  payload: {
    materialId: number;
  };
};

export type CategoryCreatedEvent = {
  type: "category.created";

  payload: {
    categoryId: number;
  };
};

export type CategoryDeletedEvent = {
  type: "category.deleted";

  payload: {
    categoryId: number;
  };
};

export type MaterialUpdatedEvent = {
  type: "material.updated";
  payload: {
    materialId: number;
  };
};

export type CategoryUpdatedEvent = {
  type: "category.updated";
  payload: {
    categoryId: number;
  };
};

export type RealtimeEvent =
  | InventoryUpdatedEvent
  | MaterialCreatedEvent
  | MaterialDeletedEvent
  | CategoryCreatedEvent
  | CategoryDeletedEvent
  | MaterialUpdatedEvent
  | CategoryUpdatedEvent;

