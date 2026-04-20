import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./api";

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
    const nextPassword = password.trim();

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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: nextEmail,
        username: nextUsername,
        password: nextPassword
      })
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

      setMessage("User registered successfully");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2>Register</h2>

      <form onSubmit={handleRegister}>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <br />
      <input
        type="text"
        placeholder="Enter email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <br />
      <br />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Registering..." : "Register"}
      </button>
      </form>
      <p>
        Already have an account?{" "}
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={() => navigate("/login")}
        >
          Login
        </span>
      </p>

      {message && (
        <p style={{ color: message.includes("success") ? "green" : "red" }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Register;
