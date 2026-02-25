import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (name, email, password) =>
    apiClient.post("/auth/register", { name, email, password }),
  login: (email, password, role) => apiClient.post("/auth/login", { email, password, role }),
  getProfile: () => apiClient.get("/auth/profile"),
  updateProfile: (name, profileImage) => apiClient.put("/auth/profile", { name, profileImage }),
  getUsers: () => apiClient.get("/auth/users"),
  updateUserRole: (id, role) => apiClient.put(`/auth/users/${id}/role`, { role }),
  deleteUser: (id) => apiClient.delete(`/auth/users/${id}`),
};

// Client API
export const clientAPI = {
  create: (clientData) => apiClient.post("/clients", clientData),
  getAll: () => apiClient.get("/clients"),
  getById: (id) => apiClient.get(`/clients/${id}`),
  update: (id, clientData) => apiClient.put(`/clients/${id}`, clientData),
  delete: (id) => apiClient.delete(`/clients/${id}`),
};

// Project API
export const projectAPI = {
  create: (projectData) => apiClient.post("/projects", projectData),
  getAll: () => apiClient.get("/projects"),
  getByClient: (clientId) => apiClient.get(`/projects/client/${clientId}`),
  getById: (id) => apiClient.get(`/projects/${id}`),
  update: (id, projectData) => apiClient.put(`/projects/${id}`, projectData),
  delete: (id) => apiClient.delete(`/projects/${id}`),
};

// Work Log API
export const workLogAPI = {
  create: (logData) => apiClient.post("/work-logs", logData),
  getAll: (filters) => apiClient.get("/work-logs", { params: filters }),
  getById: (id) => apiClient.get(`/work-logs/${id}`),
  update: (id, logData) => apiClient.put(`/work-logs/${id}`, logData),
  delete: (id) => apiClient.delete(`/work-logs/${id}`),
};

// Invoice API
export const invoiceAPI = {
  create: (invoiceData) => apiClient.post("/invoices", invoiceData),
  getAll: (filters) => apiClient.get("/invoices", { params: filters }),
  getById: (id) => apiClient.get(`/invoices/${id}`),
  update: (id, invoiceData) => apiClient.put(`/invoices/${id}`, invoiceData),
  recordPayment: (id, amount) => apiClient.post(`/invoices/${id}/payment`, { amount }),
  delete: (id) => apiClient.delete(`/invoices/${id}`),
  getStats: (clientId) => apiClient.get(`/invoices/client/${clientId}/stats`),
  downloadPdf: (id) => apiClient.get(`/invoices/${id}/pdf`, { responseType: "blob" }),
};

// Payment API
export const paymentAPI = {
  create: (paymentData) => apiClient.post("/payments", paymentData),
  getAll: (filters) => apiClient.get("/payments", { params: filters }),
  getById: (id) => apiClient.get(`/payments/${id}`),
  getByClient: (clientId) => apiClient.get(`/payments/client/${clientId}`),
  update: (id, paymentData) => apiClient.put(`/payments/${id}`, paymentData),
  delete: (id) => apiClient.delete(`/payments/${id}`),
};

// Expense API
export const expenseAPI = {
  create: (expenseData) => apiClient.post("/expenses", expenseData),
  getAll: (filters) => apiClient.get("/expenses", { params: filters }),
  getById: (id) => apiClient.get(`/expenses/${id}`),
  update: (id, expenseData) => apiClient.put(`/expenses/${id}`, expenseData),
  delete: (id) => apiClient.delete(`/expenses/${id}`),
  getSummary: (startDate, endDate) =>
    apiClient.get("/expenses/summary/all", { params: { startDate, endDate } }),
  getByCategory: (startDate, endDate) =>
    apiClient.get("/expenses/analytics/by-category", { params: { startDate, endDate } }),
  getByMonth: () => apiClient.get("/expenses/analytics/by-month"),
  bulkUpdateStatus: (expenseIds, status) =>
    apiClient.post("/expenses/bulk/update-status", { expenseIds, status }),
};

// Dashboard API
export const dashboardAPI = {
  getSummary: () => apiClient.get("/dashboard"),
  getMonthlyRevenue: (month, year) =>
    apiClient.get("/dashboard/revenue/monthly", { params: { month, year } }),
  getMonthlyExpenses: (month, year) =>
    apiClient.get("/dashboard/expenses/monthly", { params: { month, year } }),
  getProjectProfit: (projectId) => apiClient.get(`/dashboard/profit/${projectId}`),
  getProjectProfitWithExpenses: (projectId) => apiClient.get(`/dashboard/profit-with-expenses/${projectId}`),
  getUserProfit: () => apiClient.get("/dashboard/user/profit"),
  getRevenueTrend: () => apiClient.get("/dashboard/charts/revenue-trend"),
  getExpensesTrend: () => apiClient.get("/dashboard/charts/expense-trend"),
  getInvoiceStatusBreakdown: () => apiClient.get("/dashboard/charts/invoice-status"),
  getExpensesByCategory: () => apiClient.get("/dashboard/charts/expenses-by-category"),
  getTopClientsByRevenue: (limit = 5) => apiClient.get("/dashboard/charts/top-clients", { params: { limit } }),
  getProjectProfitability: (limit = 5) => apiClient.get("/dashboard/charts/project-profitability", { params: { limit } }),
};

export default apiClient;
