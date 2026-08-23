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
export type InventoryMutationResponse = {
  materialId: number;
  oldQuantity: number;
  newQuantity: number;
  difference: number;
  version: number;
};
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

export type User = {
  id: number;
  username: string;
  isActive: boolean;

  role: {
    id: number;
    name: string;
  };
};

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

export type InventoryResponse = {
  items: InventoryItem[];
};

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

export async function logout() {
  return request<{ success: boolean }>(
    "/api/auth/logout",
    {
      method: "POST",
    },
  );
}

export async function getCurrentUser() {
  return request<{ user: User }>(
    "/api/auth/me",
  );
}

export async function getInventory() {
  return request<InventoryResponse>(
    "/api/inventory",
  );
}

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