// src/components/Sidebar.jsx
import React, { useContext } from "react";
import "../styles/sidebar.css";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ onNav, onUploadClick, currentView }) {
  const { currentUser, setCurrentUser, logout } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const handleLogout = () => {
    if (typeof logout === "function") {
      logout();
    } else {
      setCurrentUser && setCurrentUser(null);
      localStorage.removeItem("user");
    }
    navigate("/login");
  };

  // Helper to add active class
  const getActiveClass = (viewName) => (currentView === viewName ? "active" : "");

  return (
    <aside className="sc-sidebar">
      <h2 className="logo">SmartCloud</h2>

      <nav>
        <button className={`side-link ${getActiveClass("myfiles")}`} onClick={() => onNav && onNav("myfiles")}>
          📁 My Files
        </button>
        <button className={`side-link ${getActiveClass("recent")}`} onClick={() => onNav && onNav("recent")}>
          🕒 Recent
        </button>
        <button className={`side-link ${getActiveClass("favorites")}`} onClick={() => onNav && onNav("favorites")}>
          ⭐ Favorites
        </button>
        <button className={`side-link ${getActiveClass("settings")}`} onClick={() => onNav && onNav("settings")}>
          ⚙️ Settings
        </button>
        <button className="side-link" onClick={onUploadClick}>
          ⬆️ Upload
        </button>
        <button className={`side-link ${getActiveClass("trash")}`} onClick={() => onNav && onNav("trash")}>
          🗑 Trash
        </button>
        
      </nav>
    </aside>
  );
}