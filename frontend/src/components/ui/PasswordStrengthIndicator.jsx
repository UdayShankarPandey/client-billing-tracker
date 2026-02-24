import React from "react";
import "./PasswordStrengthIndicator.css";

const PasswordStrengthIndicator = ({ password }) => {
  const calculateStrength = () => {
    let strength = 0;
    if (!password) return { level: 0, label: "", percentage: 0 };

    // Length check
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (password.length >= 16) strength++;

    // Character variety checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    // Return strength level
    if (strength <= 2) return { level: 1, label: "Weak", percentage: 25, color: "#ff6b6b" };
    if (strength <= 4) return { level: 2, label: "Fair", percentage: 50, color: "#ffa94d" };
    if (strength <= 5) return { level: 3, label: "Good", percentage: 75, color: "#74b9ff" };
    return { level: 4, label: "Strong", percentage: 100, color: "#16ff6e" };
  };

  const strength = calculateStrength();

  if (strength.level === 0) return null;

  return (
    <div className="password-strength-wrapper">
      <div className="password-strength-label">
        <span>Password Strength:</span>
        <span className="password-strength-text" style={{ color: strength.color }}>
          {strength.label}
        </span>
      </div>
      <div className="password-strength-bar">
        <div
          className="password-strength-fill"
          style={{
            width: `${strength.percentage}%`,
            backgroundColor: strength.color,
          }}
        ></div>
      </div>
      <div className="password-strength-hints">
        <ul>
          <li className={password.length >= 8 ? "met" : ""}>
            {password.length >= 8 ? "✓" : "○"} At least 8 characters
          </li>
          <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "met" : ""}>
            {/[A-Z]/.test(password) && /[a-z]/.test(password) ? "✓" : "○"} Mix of uppercase and lowercase
          </li>
          <li className={/[0-9]/.test(password) ? "met" : ""}>
            {/[0-9]/.test(password) ? "✓" : "○"} At least one number
          </li>
          <li className={/[^a-zA-Z0-9]/.test(password) ? "met" : ""}>
            {/[^a-zA-Z0-9]/.test(password) ? "✓" : "○"} Special character (!@#$%^&*)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
