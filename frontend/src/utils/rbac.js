export const ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
  VIEWER: "viewer",
  CLIENT: "client",
};

export const PERMISSIONS = {
  // Dashboard & Analytics
  VIEW_DASHBOARD: "view_dashboard",
  
  // Client Management
  VIEW_CLIENTS: "view_clients",
  MANAGE_CLIENTS: "manage_clients",
  
  // Project Management
  VIEW_PROJECTS: "view_projects",
  MANAGE_PROJECTS: "manage_projects",
  
  // Work Log Management
  VIEW_WORK_LOGS: "view_work_logs",
  MANAGE_WORK_LOGS: "manage_work_logs",
  
  // Invoice Management
  VIEW_INVOICES: "view_invoices",
  MANAGE_INVOICES: "manage_invoices",
  DELETE_INVOICES: "delete_invoices",
  
  // Payment Management
  VIEW_PAYMENTS: "view_payments",
  RECORD_PAYMENTS: "record_payments",
  DELETE_PAYMENTS: "delete_payments",
  
  // Expense Management
  VIEW_EXPENSES: "view_expenses",
  MANAGE_EXPENSES: "manage_expenses",
  DELETE_EXPENSES: "delete_expenses",
  
  // User & System Management
  MANAGE_USERS: "manage_users",
  MANAGE_SYSTEM_SETTINGS: "manage_system_settings",
  MANAGE_TAX_SETTINGS: "manage_tax_settings",
  MANAGE_INVOICE_BRANDING: "manage_invoice_branding",
  
  // Profile
  VIEW_PROFILE: "view_profile",
  VIEW_CLIENT_PORTAL: "view_client_portal",
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // ADMIN: All permissions
  [ROLES.STAFF]: [
    // Dashboard & Analytics
    PERMISSIONS.VIEW_DASHBOARD,
    
    // Client Management
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_CLIENTS,
    
    // Project Management
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.MANAGE_PROJECTS,
    
    // Work Log Management
    PERMISSIONS.VIEW_WORK_LOGS,
    PERMISSIONS.MANAGE_WORK_LOGS,
    
    // Invoice Management
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.MANAGE_INVOICES, // Create & send invoices
    
    // Payment Management
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.RECORD_PAYMENTS, // Can record payments (create only, not delete)
    
    // Expense Management
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.MANAGE_EXPENSES,
    
    // Profile
    PERMISSIONS.VIEW_PROFILE,
  ],
  [ROLES.VIEWER]: [
    // Dashboard & Analytics
    PERMISSIONS.VIEW_DASHBOARD,
    
    // View-only access
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_WORK_LOGS,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.VIEW_EXPENSES,
    
    // Profile
    PERMISSIONS.VIEW_PROFILE,
  ],
  [ROLES.CLIENT]: [
    // Client Portal
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.VIEW_CLIENT_PORTAL,
  ],
};

export const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const userHasRole = (allowedRoles = [], user = readStoredUser()) => {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
};

export const userHasPermission = (permission, user = readStoredUser()) => {
  if (!user || !user.role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
};
