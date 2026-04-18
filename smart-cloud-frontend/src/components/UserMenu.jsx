// src/components/UserMenu.jsx
import React, { useState, useContext } from "react";
import "../styles/usermenu.css";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function UserMenu() {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="user-menu-wrapper">

      {/* Small avatar at top-right */}
      <div
        className="avatar"
        onClick={() => setOpen(!open)}
      >
        {currentUser?.email?.charAt(0).toUpperCase() || "U"}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="dropdown">

          <div className="profile-info">
            {/* Large avatar inside dropdown */}
            <div className="avatar-big">
              {currentUser?.email?.charAt(0).toUpperCase() || "U"}
            </div>

            {/* Email display */}
            <div className="user-details">
              <div className="user-email">
                {currentUser?.email || "No email"}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>

        </div>
      )}
    </div>
  );
}