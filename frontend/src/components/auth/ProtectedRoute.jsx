import React from "react";
import { Navigate } from "react-router-dom";
import EmptyState from "../ui/EmptyState";
import { readStoredUser, userHasPermission, userHasRole } from "../../utils/rbac";

const ProtectedRoute = ({ allowedRoles, requiredPermission, children }) => {
  const user = readStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length && !userHasRole(allowedRoles, user)) {
    return (
      <EmptyState
        title="Access denied"
        description="You do not have permission to access this page."
      />
    );
  }

  if (requiredPermission && !userHasPermission(requiredPermission, user)) {
    return (
      <EmptyState
        title="Access denied"
        description="You do not have permission to access this page."
      />
    );
  }

  return children;
};

export default ProtectedRoute;
