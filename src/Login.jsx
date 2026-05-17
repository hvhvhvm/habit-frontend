import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./api";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Show session expired message only if explicitly set by a route guard
  useEffect(() => {
    const expired = sessionStorage.getItem("session_expired");
    if (expired) {
      setMessage("Your session has expired. Please log in again.");
      sessionStorage.removeItem("session_expired");
    }
  }, []);

  // If a valid token already exists, skip login and go to dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;

    async function validateToken() {
      try {
        const res = await fetch(apiUrl("/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        if (res.ok) {
          navigate("/dashboard", { replace: true });
          return;
        }

        // Only remove token if server explicitly rejects it
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
        }
        // On 500 or network error, leave token — don't falsely expire the session

      } catch {
        // Network error — do NOT remove token, user might just be offline
      }
    }

    validateToken();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleLogin(event) {
    event.preventDefault();

    const loginId = email.trim();
    const nextPassword = password.trim();

    if (!loginId || !nextPassword) {
      setMessage("Enter your email/username and password.");
      return;
    }

    const formData = new URLSearchParams();
    formData.append("username", loginId);  // backend accepts email OR username here
    formData.append("password", nextPassword);

    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!res.ok) {
        let detail = "Login failed";
        try {
          const errorPayload = await res.json();
          detail = errorPayload.detail || detail;
        } catch {
          detail = "Server returned an unexpected response";
        }

        throw new Error(
          detail === "Invalid credentials"
            ? "Invalid email/username or password"
            : detail
        );
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      if (data.username) localStorage.setItem("name", data.username);
      navigate("/dashboard", { replace: true });

    } catch (err) {
      setMessage(err.message || "Could not connect to the server");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-bg-blob auth-bg-blob--1" />
      <div className="auth-bg-blob auth-bg-blob--2" />

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo" />
          <span className="auth-logo-text">Focus Now</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Log in to your account to continue</p>

        {message && (
          <div className="auth-alert">
            <span>⚠️</span> {message}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-input-group">
            <label htmlFor="email">Email or Username</label>
            <div className="auth-input-wrapper">
              <input
                id="email"
                type="text"
                placeholder="Enter email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="auth-spinner" />
                <span>Signing In...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <span className="auth-link" onClick={() => navigate("/register")}>
            Register
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;
