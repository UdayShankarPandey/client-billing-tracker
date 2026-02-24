import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { mergeUserWithPrefs } from "../utils/userPrefs";
import PasswordStrengthIndicator from "../components/ui/PasswordStrengthIndicator";
import brandLogo from "../assets/billing-logo.png";
import "./Auth.css";

const RegisterPage = ({ setIsAuthenticated }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await authAPI.register(name, email, password);
      // Auto login after registration
      const loginResponse = await authAPI.login(email, password);
      const mergedUser = mergeUserWithPrefs(loginResponse.data.user);
      localStorage.setItem("token", loginResponse.data.token);
      localStorage.setItem("user", JSON.stringify(mergedUser));
      window.dispatchEvent(new Event("user-updated"));
      setIsAuthenticated(true);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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
        <h2 className="auth-subtitle">✨ Create Account</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>👤 Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

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
            <PasswordStrengthIndicator password={password} />
          </div>

          <div className="form-group">
            <label>✅ Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary create-account-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
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

export default RegisterPage;
