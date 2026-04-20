import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
      if (localStorage.getItem("token")) {
        navigate("/dashboard", { replace: true });
      }
    }, [navigate]);

    function handleLogin() {
        console.log(email, password);

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    fetch("https://habit-backend-v3gv.onrender.com//auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Login failed");
        }
        return res.json();
    })
    .then(data => {
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard", { replace: true });
    })
    .catch(() => alert("Invalid credentials"));
  }


    return(
        <div>
            <h2>Login</h2>
            <input 
             type = "email"
             placeholder="Enter email"
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
             <button onClick = {handleLogin}>Login</button>
             <p>
              Don't have an account? 
              <span
              style={{ color: "blue", cursor: "pointer" }}
              onClick={() => navigate("/register")}
              >
              Register
              </span>
             
              </p>
        </div>
    )

}
export default Login;
