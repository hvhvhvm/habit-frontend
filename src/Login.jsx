import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./api";
function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
      if (localStorage.getItem("token")) {
        navigate("/dashboard", { replace: true });
      }
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
    formData.append("username", loginId);
    formData.append("password", nextPassword);

    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
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
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setMessage(err.message || "Could not connect to the server");
    } finally {
      setIsSubmitting(false);
    }
  }


    return(
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
            <input 
             type = "text"
             placeholder="Enter email or username"
             value = {email}
             onChange = {(e) => setEmail(e.target.value)}
             />
             <br/>
             <input 
             type = "password"
             placeholder = "Enter password"
             value = {password}
             onChange = {(e) => setPassword(e.target.value)}
             />
             <br/>
             <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
             </button>
             </form>
             <p>
              Don't have an account? 
              <span
              style={{ color: "blue", cursor: "pointer" }}
              onClick={() => navigate("/register")}
              >
              Register
              </span>
             
              </p>
              {message && <p style={{ color: "red" }}>{message}</p>}
        </div>
    )

}
export default Login;
