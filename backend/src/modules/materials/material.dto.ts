// This function converts a material object into a MaterialDto object.

export function toMaterialDto(material: {
  id: number;
  name: string;
  description: string | null;
  unit: string;
  minimumQuantity: number;
  isActive: boolean;
  category: {
    id: number;
    name: string;
  };
  inventory: {
    quantity: number;
    version: number;
  } | null;
}) {
  const quantity =
    material.inventory?.quantity ?? 0;

  return {
    id: material.id,
    name: material.name,
    description: material.description,
    unit: material.unit,

    category: {
      id: material.category.id,
      name: material.category.name,
    },

    quantity,
    minimumQuantity:
      material.minimumQuantity,

    lowStock:
      quantity <= material.minimumQuantity,

    version:
      material.inventory?.version ?? 0,

    isActive: material.isActive,
  };
}