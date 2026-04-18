import { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
const email = location.state?.email || localStorage.getItem("otpEmail");
  const [otp, setOtp] = useState("");

  const verifyOtp = async () => {
    if (!otp) {
      alert("Please enter OTP");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/verify-otp", { email, otp });
      alert("OTP verified! You can now access the app.");
      navigate("/"); // navigate to login or dashboard
    } catch (err) {
      alert("OTP verification failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Verify OTP</h2>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <button className="verify-btn" onClick={verifyOtp}>
          Verify OTP
        </button>
      </div>
    </div>
  );
}