import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AppBackground from "./components/layout/AppBackground";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ClientsPage from "./pages/ClientsPage";
import ProjectsPage from "./pages/ProjectsPage";
import WorkLogsPage from "./pages/WorkLogsPage";
import InvoicesPage from "./pages/InvoicesPage";
import PaymentsPage from "./pages/PaymentsPage";
import ExpensesPage from "./pages/ExpensesPage";
import ProfilePage from "./pages/ProfilePage";
import UsersPage from "./pages/UsersPage";
import ClientPortalPage from "./pages/ClientPortalPage";
import { persistCurrentUserSnapshot } from "./utils/userPrefs";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { readStoredUser, PERMISSIONS } from "./utils/rbac";
import { authAPI } from "./services/api";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [isValidatingToken, setIsValidatingToken] = useState(!!localStorage.getItem("token"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentRole = readStoredUser()?.role;

  // Validate token on app startup
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await authAPI.getProfile();
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid or expired - clear storage and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        }
      }
      setIsValidatingToken(false);
    };

    validateToken();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    persistCurrentUserSnapshot();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
  };

  // Show loading state while validating token
  if (isValidatingToken) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "20px" }}>Loading...</div>
          <div style={{ fontSize: "14px", color: "#666" }}>Validating session...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route
            path="/register"
            element={<RegisterPage setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  if (currentRole === "client") {
    return (
      <Router>
        <div className="app-layout">
          <AppBackground />
          <div className="app-main" style={{ marginLeft: 0 }}>
            <Navbar onLogout={handleLogout} />
            <main className="app-content">
              <Routes>
                <Route
                  path="/portal"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_CLIENT_PORTAL}>
                      <ClientPortalPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_PROFILE}>
                      <ProfilePage onLogout={handleLogout} />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/portal" />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-layout">
        <AppBackground />
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
        />
        <div className={`app-main ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <Navbar
            onMenuToggle={() => setSidebarOpen((open) => !open)}
            onSidebarCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)}
            isSidebarCollapsed={sidebarCollapsed}
            onLogout={handleLogout}
          />
          <main className="app-content">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DASHBOARD}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_CLIENTS}>
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_PROJECTS}>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/work-logs"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_WORK_LOGS}>
                    <WorkLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_INVOICES}>
                    <InvoicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_PAYMENTS}>
                    <PaymentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_EXPENSES}>
                    <ExpensesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_USERS}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_PROFILE}>
                    <ProfilePage onLogout={handleLogout} />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
