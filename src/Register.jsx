import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./api";
import "./Auth.css";

function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(event) {
    event.preventDefault();

    const nextUsername = username.trim();
    const nextEmail = email.trim().toLowerCase();
    const nextPassword = password;

    if (!nextUsername || !nextEmail || !nextPassword) {
      setMessage("Username, email, and password are required");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(apiUrl("/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: nextEmail,
          username: nextUsername,
          password: nextPassword,
        }),
      });

      if (!res.ok) {
        let detail = "Registration failed";

        try {
          const errorPayload = await res.json();
          detail = errorPayload.detail || detail;
        } catch {
          detail = "Server returned an unexpected response";
        }

        throw new Error(detail);
      }

      const data = await res.json();

      localStorage.setItem("token", data.access_token);
      if (data.username) localStorage.setItem("name", data.username);

      navigate("/onboarding", { replace: true });
    } catch (err) {
      setMessage(err.message || "Something went wrong");
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

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join us to start habit tracking today</p>

        {message && (
          <div className="auth-alert">
            <span>⚠️</span> {message}
          </div>
        )}

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="auth-input-group">
            <label htmlFor="username">Username</label>
            <div className="auth-input-wrapper">
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="email">Email Address</label>
            <div className="auth-input-wrapper">
              <input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setPassword(event.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="auth-spinner" />
                <span>Registering...</span>
              </>
            ) : (
              "Get Started"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <span className="auth-link" onClick={() => navigate("/login")}>
            Login
          </span>
        </div>
      </div>
    </div>
  );
}

export default Register;
