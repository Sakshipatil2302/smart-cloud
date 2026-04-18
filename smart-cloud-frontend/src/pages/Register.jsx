import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const registerUser = async () => {
    if (!email || !password) {
      setError("Email & password required");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/register", { email, password });
      alert("OTP sent to your Gmail!");
      localStorage.setItem("otpEmail", email);
      navigate("/verify-otp");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Smart Cloud Register</h2>

        <input
          type="email"
          placeholder="Enter Gmail"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
        />

        <button onClick={registerUser}>Send OTP</button>

        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}