import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { mergeUserWithPrefs } from "../utils/userPrefs";
import { ROLES } from "../utils/rbac";
import brandLogo from "../assets/billing-logo.png";
import "./Auth.css";

const LoginPage = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(ROLES.ADMIN);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const submitRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.login(email, password, role);
      const mergedUser = mergeUserWithPrefs(response.data.user);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(mergedUser));
      window.dispatchEvent(new Event("user-updated"));
      setIsAuthenticated(true);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand-top">
          <img src={brandLogo} alt="Billing Tracker logo" className="auth-brand-logo" />
        </div>
        <h1 className="auth-title">Billing Tracker</h1>
        <h2 className="auth-subtitle">🔏 Sign In</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="sign-in-form">
          <div className="form-group">
            <label>📧 Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>🔐 Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>👤 Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} required disabled={loading}>
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.STAFF}>Staff</option>
              <option value={ROLES.CLIENT}>Client</option>
            </select>
          </div>

          <div
            className="sign-in-box"
            role="button"
            tabIndex={0}
            onClick={() => submitRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                submitRef.current?.click();
              }
            }}
            aria-disabled={loading}
          >
            <button ref={submitRef} type="submit" className="btn-primary login-submit-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
      <div className="fixed bottom-4 left-4 text-xs text-blue-600 dark:text-blue-400">
        Developed by{" "}
        <a
          href="https://github.com/UdayShankarPandey"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-700 dark:text-blue-300 hover:underline"
        >
          Uday Shankar Pandey
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
