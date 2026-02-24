import React, { useCallback, useEffect, useState } from "react";
import { authAPI } from "../services/api";
import StateWrapper from "../components/ui/StateWrapper";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import "./ListPage.css";

const roleOptions = ["staff", "client"];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setError("");
      const response = await authAPI.getUsers();
      setUsers(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (id, role) => {
    try {
      await authAPI.updateUserRole(id, role);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await authAPI.deleteUser(id);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title"><span className="page-title-emoji">👤</span> <span className="page-title-text">Users</span></h1>
      </div>
      <StateWrapper
        loading={loading}
        error={error}
        isEmpty={!loading && users.length === 0}
        emptyTitle="No users"
        emptyDescription="No users are available yet."
        loadingContent={
          <div className="card">
            <SkeletonLoader lines={6} />
          </div>
        }
        onRetry={fetchUsers}
      >
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    {!roleOptions.includes(user.role) ? (
                      <span className="text-muted">{user.role}</span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      >
                        {roleOptions.map((role) => (
                          <option value={role} key={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <button className="btn-danger" onClick={() => handleDelete(user._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StateWrapper>
    </div>
  );
};

export default UsersPage;
