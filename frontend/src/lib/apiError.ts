import { ApiError } from "./api";

export type ApiErrorKey =
  | "unauthenticated"
  | "invalidCredentials"
  | "forbidden"
  | "notFound"
  | "insufficientStock"
  | "versionConflict"
  | "validation"
  | "inventoryNotFound"
  | "unknown";

export function getApiErrorKey(
  error: unknown,
): ApiErrorKey {
  if (!(error instanceof ApiError)) {
    return "unknown";
  }

  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return "invalidCredentials";

    case "UNAUTHENTICATED":
      return "unauthenticated";

    case "INSUFFICIENT_STOCK":
      return "insufficientStock";

    case "VERSION_CONFLICT":
      return "versionConflict";

    case "VALIDATION_ERROR":
      return "validation";

    case "INVENTORY_NOT_FOUND":
      return "inventoryNotFound";

    default:
      break;
  }

  switch (error.status) {
    case 401:
      return "unauthenticated";

    case 403:
      return "forbidden";

    case 404:
      return "notFound";

    default:
      return "unknown";
  }
}

  export function getUserFriendlyErrorMessage(
  error: unknown,
): string {
  switch (getApiErrorKey(error)) {
    case "unauthenticated":
      return "Your session has expired. Please log in again.";

    case "invalidCredentials":
      return "Invalid username or password";

    case "forbidden":
      return "You do not have permission to perform this action.";

    case "notFound":
      return "The requested resource was not found.";

    case "insufficientStock":
      return "There is not enough stock for this operation.";

    case "versionConflict":
      return "This item was changed by another user. Please refresh and try again.";

    case "validation":
      return "Please check the entered data.";

    case "inventoryNotFound":
      return "The inventory item was not found.";

    default:
      return "Something went wrong. Please try again.";
  }
}