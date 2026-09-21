export const en = {
  navigation: {
    inventory: "Inventory",
    administration: "Administration",
    dashboard: "Dashboard",
    categories: "Categories",
    materials: "Materials",
    users: "Users",
    history: "History",
    settings: "Settings",
  },

  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    loading: "Loading...",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
    navigation: "Navigation",
    logout: "Logout",
    clear: "clear",
  },

  apiErrors: {
  unauthenticated:
    "Your session has expired. Please log in again.",
  invalidCredentials:
    "Invalid username or password",
  forbidden:
    "You do not have permission to perform this action.",
  notFound:
    "The requested resource was not found.",
  insufficientStock:
    "There is not enough stock for this operation.",
  versionConflict:
    "This item was changed by another user. Please refresh and try again.",
  validation:
    "Please check the entered data.",
  inventoryNotFound:
    "The inventory item was not found.",
  unknown:
    "Something went wrong. Please try again.",
},

  login: {
  title: "Warehouse Inventory",
  subtitle: "Sign in to continue",
  username: "Username",
  password: "Password",
  submit: "Log in",
  submitting: "Logging in...",
  invalidCredentials: "Invalid username or password",
  connectionError: "Unable to connect to server",
},

inventory: {
  title: "Inventory",
  description: "Manage warehouse materials and quantities.",
  searchPlaceholder: "Search materials...",
  loading: "Loading inventory...",
  item: "Item",
  category: "Category",
  quantity: "Quantity",
  status: "Status",
  actions: "Actions",
  minimum: "Minimum",
  lowStock: "Low Stock",
  inStock: "In Stock",
  save: "Save",
  cancel: "Cancel",
  setQuantity: "Set Quantity",
  noMaterials: "No materials found.",
  quantityValidation:
    "Quantity must be a non-negative integer",
  versionConflict:
    "Inventory was changed by another user. Please try again.",
  updateError: "Failed to update inventory",
  setQuantityError:
    "Failed to set inventory quantity",
  logout: "Logout",
},

admin: {
  title: "Administration",
  description: "Select an administrative section.",
},

categories: {
  title: "Categories",
  description: "Manage material categories.",
  add: "Add category",
  addName: "Create a new material category.",
  updateName: "Update the category information.",
  exmpl: "e. g. packing",
  edit: "Edit category",
  name: "Name",
  create: "Create category",
  descriptionField: "Description",
  actions: "Actions",
  editAction: "Edit",
  deleteAction: "Delete",
  deleting: "Deleting...",
  loading: "Loading categories...",
  empty: "No categories found.",
  nameRequired: "Category name is required",
  createError: "Failed to create category",
  updateError: "Failed to update category",
  deleteError: "Failed to delete category",
  deleteConfirm: "Delete category",
  namePlaceholder: "Category name",
  descriptionPlaceholder: "Category description",
  save: "Save",
  cancel: "Cancel",
},

dashboard: {
  title: "Dashboard",
  welcome: "Welcome",
  materials: "Materials",
  categories: "Categories",
  lowStock: "Low Stock",
  totalQuantity: "Total Quantity",
  categoryImage: "Category image",
  materialsCount: "materials",
  loading: "Loading dashboard...",
  loadError: "Failed to load dashboard",
  viewInventory: "View inventory",
  viewCategories: "View categories",
  viewLowStock: "View low stock",
  noCategories: "No categories available",
},

} as const;