// src/pages/Login.jsx
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const loginUser = async () => {
    if (!email || !password) {
      setErrorMsg("Please enter email and password");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });

      // Backend returns user object
      const user = res.data.user;

      if (!user || !user.token) {
        setErrorMsg(res.data.message || "Login failed");
        return;
      }

      // Update context and localStorage
      login({
        name: user.name || "",
        email: user.email,
        token: user.token
      });

      // Navigate to dashboard after login
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Smart Cloud Login</h2>

        {errorMsg && <div className="error-msg">{errorMsg}</div>}

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button className="login-btn" onClick={loginUser}>
          Login
        </button>

        <p className="switch">
          Don't have an account? <Link to="/register"> Register</Link>
        </p>
      </div>
    </div>
  );
}