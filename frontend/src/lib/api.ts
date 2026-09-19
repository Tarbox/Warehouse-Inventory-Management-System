// Base URL of the Backend API.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "";

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

export type InventorySortBy =
  | "name"
  | "category"
  | "quantity"
  | "status";

export type InventorySortOrder =
  | "asc"
  | "desc";

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

  if (!response.ok) {
    let error: ApiErrorResponse = {
      error: "UNKNOWN_ERROR",
      message: "Request failed",
    };

    try {
      error =
        (await response.json()) as ApiErrorResponse;
    } catch {
      // Response has no JSON body.
    }

    throw new ApiError(
      response.status,
      error.error,
      error.message,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
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
export async function getInventory(
  sortBy: InventorySortBy = "name",
  sortOrder: InventorySortOrder = "asc",
  categoryId?: number,
) {
  const params = new URLSearchParams({
    sortBy,
    sortOrder,
  });

  if (categoryId !== undefined) {
    params.set("categoryId", String(categoryId));
  }

  return request<InventoryResponse>(
    `/api/inventory?${params.toString()}`,
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

// Set the inventory quantity for a specific material.
export async function setInventory(
  materialId: number,
  quantity: number,
  expectedVersion: number,
) {
  return request<InventoryMutationResponse>(
    `/api/inventory/${materialId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        quantity,
        expectedVersion,
      }),
    },
  );
}

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
  imageUrl: string | null;
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

// Input data structure for creating a category.
export type CreateCategoryInput = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
};

// Input data structure for updating a category.
export type UpdateCategoryInput = {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
};

// Create a new category in the Backend API.
export async function createCategory(
  input: CreateCategoryInput,
) {
  return request<Category>(
    "/api/categories",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

// Update an existing category in the Backend API.
export async function updateCategory(
  id: number,
  input: UpdateCategoryInput,
) {
  return request<Category>(
    `/api/categories/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

// Delete a category from the Backend API by its ID.
export async function deleteCategory(
  id: number,
) {
  return request<void>(
    `/api/categories/${id}`,
    {
      method: "DELETE",
    },
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

// Frontend representation of an admin user returned by the Backend API.
export type AdminUser = {
  id: number;
  username: string;

  isActive: boolean;

  role: {
    id: number;
    name: string;
  };

  createdAt: string;
  updatedAt: string;
};

// Response returned when requesting the list of users from the Backend API.
export type UsersResponse = {
  items: AdminUser[];
};

// Fetch the list of users from the Backend API.
export async function getUsers() {
  return request<UsersResponse>(
    "/api/users",
  );
}

// Create a new user in the Backend API with the provided input data.
export async function createUser(
  input: {
    username: string;
    password: string;
    roleId: number;
  },
) {

// Send a POST request to the Backend API to create a new user with the specified username, password, and role ID.
  return request(
    "/api/users",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

// Disable a user in the Backend API by their ID.
export async function disableUser(
  id: number,
) {

// Send a POST request to the Backend API to disable the user with the specified ID.
  return request<void>(
    `/api/users/${id}/disable`,
    {
      method: "POST",
    },
  );
}

// Enable a disabled user in the Backend API.
export async function enableUser(
  id: number,
) {
  return request<void>(
    `/api/users/${id}/enable`,
    {
      method: "POST",
    },
  );
}
// Enable a user in the Backend API by their ID.
export async function changeUserRole(
  id: number,
  roleId: number,
) {

// Send a PATCH request to the Backend API to change the role of the user with the specified ID to the new role ID.
  return request(
    `/api/users/${id}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({
        roleId,
      }),
    },
  );
}

// Reset a user's password in the Backend API by their ID.
export async function resetUserPassword(
  id: number,
  password: string,
) {

// Send a POST request to the Backend API to reset the password of the user with the specified ID to the new password.
  return request<void>(
    `/api/users/${id}/reset-password`,
    {
      method: "POST",
      body: JSON.stringify({
        password,
      }),
    },
  );
}

// Delete a user in the Backend API by their ID.
export async function deleteUser(
  id: number,
) {

// Send a DELETE request to the Backend API to remove the user with the specified ID from the system.
  return request<void>(
    `/api/users/${id}`,
    {
      method: "DELETE",
    },
  );
}

// Frontend representation of a system setting returned by the Backend API.
// Represents a system setting with its key, value, description, and timestamps.
export type SystemSetting = {
  id: number;
  key: string;
  value: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

// Response returned when requesting the list of system settings from the Backend API.
export type SettingsResponse = {
  items: SystemSetting[];
};

// Fetch the list of system settings from the Backend API.
export async function getSettings() {
  return request<SettingsResponse>(
    "/api/settings",
  );
}

// Update a specific system setting in the Backend API by its key with the provided value.
export async function updateSetting(
  key: string,
  value: string,
) {

// Send a PATCH request to the Backend API to update the value of the system setting identified by the specified key.
// The request body contains the new value for the setting, and the response includes the updated setting object.
  return request<{
    setting: SystemSetting;
  }>(
    `/api/settings/${encodeURIComponent(
      key,
    )}`,
    {
      method: "PATCH",

      body: JSON.stringify({
        value,
      }),
    },
  );
}