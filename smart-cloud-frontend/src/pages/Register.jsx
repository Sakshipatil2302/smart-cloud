import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const registerUser = async () => {
    if (!email || !password) {
      setError("Email & password required");
      return;
    }

    try {
      setLoading(true);

      // ✅ CORRECT: using API (NOT axios)
      const res = await API.post("/api/auth/register", {
        email,
        password,
      });

      console.log(res.data);

      alert("OTP sent to your Gmail!");

      // store email for OTP verification page
      localStorage.setItem("otpEmail", email);

      navigate("/verify-otp");

    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
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

        <button onClick={registerUser} disabled={loading}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}