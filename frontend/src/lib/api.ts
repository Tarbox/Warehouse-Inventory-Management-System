// Base URL of the Backend API.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

type ApiErrorResponse = {
  error: string;
  message: string;
};

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
// Response returned after an inventory quantity change.
export type InventoryMutationResponse = {
  materialId: number;
  oldQuantity: number;
  newQuantity: number;
  difference: number;
  version: number;
};

// Generic HTTP request helper used by all API functions. 
// Handles credentials, JSON headers, response parsing, 
// and conversion of API errors into ApiError instances.
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,

      credentials: "include",

headers: {
  ...(options.body
    ? { "Content-Type": "application/json" }
    : {}),
  ...options.headers,
},
    },
  );

  // Parse the JSON response from the Backend.
  const data =
    (await response.json()) as T | ApiErrorResponse;

  if (!response.ok) {
    const error =
      data as ApiErrorResponse;

    throw new ApiError(
      response.status,
      error.error,
      error.message,
    );
  }

  return data as T;
}

// Frontend representation of an authenticated user 
// returned by the Backend API.
export type User = {
  id: number;
  username: string;
  isActive: boolean;

  role: {
    id: number;
    name: string;
  };
};

// Represents a material together with its current inventory data.
export type InventoryItem = {
  id: number;
  name: string;
  description: string | null;
  unit: string;

  category: {
    id: number;
    name: string;
  };

  quantity: number;
  minimumQuantity: number;
  lowStock: boolean;
  version: number;
};

// Response returned when requesting the inventory list.
export type InventoryResponse = {
  items: InventoryItem[];
};

// Authenticate a user and create a session on the Backend.
export async function login(
  username: string,
  password: string,
) {
  return request<{ user: User }>(
    "/api/auth/login",
    {
      method: "POST",

      body: JSON.stringify({
        username,
        password,
      }),
    },
  );
}

// End the current user session.
export async function logout() {
  return request<{ success: boolean }>(
    "/api/auth/logout",
    {
      method: "POST",
    },
  );
}

// Retrieve the currently authenticated user using the session cookie.
export async function getCurrentUser() {
  return request<{ user: User }>(
    "/api/auth/me",
  );
}

// Retrieve the current inventory list from the Backend.
export async function getInventory() {
  return request<InventoryResponse>(
    "/api/inventory",
  );
}

// Increase the inventory quantity for a specific material.
export async function incrementInventory(
  materialId: number,
  amount = 1,
) {
  return request<InventoryMutationResponse>(
    `/api/inventory/${materialId}/increment`,
    {
      method: "POST",

      body: JSON.stringify({
        amount,
      }),
    },
  );
}

// Decrease the inventory quantity for a specific material.
export async function decrementInventory(
  materialId: number,
  amount = 1,
) {
  return request<InventoryMutationResponse>(
    `/api/inventory/${materialId}/decrement`,
    {
      method: "POST",

      body: JSON.stringify({
        amount,
      }),
    },
  );
}

// Set the inventory quantity for a specific material to a desired value.
export type HistoryItem = {
  id: string;

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

  operation:
    | "INCREMENT"
    | "DECREMENT"
    | "SET";

  createdAt: string;
};

// Response returned when requesting the inventory change history.
export type HistoryResponse = {
  items: HistoryItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Retrieve the inventory change history from the Backend with pagination support.
export async function getHistory(
  page = 1,
  limit = 50,
) {
// Fetch the history data from the Backend API, including pagination parameters in the query string.
  return request<HistoryResponse>(
    `/api/history?page=${page}&limit=${limit}`,
  );
}

// Retrieve the list of categories from the Backend API.
export type Category = {
  id: number;
  name: string;
  description: string | null;
};

// Response returned when requesting the list of categories from the Backend API.
export type CategoriesResponse = {
  items: Category[];
};

// Fetch the list of categories from the Backend API.
export async function getCategories() {
  return request<CategoriesResponse>(
    "/api/categories",
  );
}


// Input data structure for creating a new material in the Backend API.
export type CreateMaterialInput = {
  name: string;
  description?: string | null;
  unit:
    | "PCS"
    | "BOX"
    | "ROLL"
    | "PACK"
    | "PAIR"
    | "OTHER";
  minimumQuantity: number;
  categoryId: number;
  initialQuantity: number;
};

// Input data structure for updating an existing material in the Backend API.
export type UpdateMaterialInput = {
  name?: string;
  description?: string | null;
  unit?:
    | "PCS"
    | "BOX"
    | "ROLL"
    | "PACK"
    | "PAIR"
    | "OTHER";
  minimumQuantity?: number;
  categoryId?: number;
};

// Create a new material in the Backend API with the provided input data.
export async function createMaterial(
  input: CreateMaterialInput,
) {
  return request(
    "/api/materials",
    {
      method: "POST",

      body: JSON.stringify(input),
    },
  );
}

// Update an existing material in the Backend API with the provided input data.
export async function updateMaterial(
  id: number,
  input: UpdateMaterialInput,
) {
  return request(
    `/api/materials/${id}`,
    {
      method: "PATCH",

      body: JSON.stringify(input),
    },
  );
}

// Delete a material from the Backend API by its ID.
export async function deleteMaterial(
  id: number,
) {
  return request<void>(
    `/api/materials/${id}`,
    {
      method: "DELETE",
    },
  );
}