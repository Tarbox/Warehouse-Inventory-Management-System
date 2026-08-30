export function toHistoryDto(item: {
  id: bigint;
  user: {
    id: number;
    username: string;
  };
  material: {
    id: number;
    name: string;
    unit: string;
  };
  oldQuantity: number;
  newQuantity: number;
  difference: number;
  operation: string;
  createdAt: Date;
}) {
  return {
    id: item.id.toString(),

    user: {
      id: item.user.id,
      username: item.user.username,
    },

    material: {
      id: item.material.id,
      name: item.material.name,
      unit: item.material.unit,
    },

    oldQuantity: item.oldQuantity,
    newQuantity: item.newQuantity,
    difference: item.difference,
    operation: item.operation,

    createdAt:
      item.createdAt.toISOString(),
  };
}