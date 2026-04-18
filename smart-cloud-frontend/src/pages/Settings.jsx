// src/pages/Settings.jsx
import React, { useContext, useState, useEffect } from "react";
import "../styles/settings.css";
import { AuthContext } from "../context/AuthContext";

export default function Settings() {
  const { currentUser } = useContext(AuthContext);

  const [name, setName] = useState(currentUser?.name || "");
  const [email] = useState(currentUser?.email || "");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [density, setDensity] = useState(
    parseInt(localStorage.getItem("density")) || 1
  ); // 1 = compact, 2 = normal, 3 = spacious

  // Apply theme
  useEffect(() => {
    document.body.className = theme === "dark" ? "dark-theme" : "";
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Apply density
  useEffect(() => {
    document.body.dataset.density = density; // set a data attribute
    localStorage.setItem("density", density);
  }, [density]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      {/* Account Section */}
      <div className="settings-section">
        <h3>Account</h3>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Email:
          <input type="email" value={email} disabled />
        </label>
      </div>

      {/* Appearance Section */}
      <div className="settings-section">
        <h3>Appearance</h3>
        <div className="theme-toggle">
          <span>Theme: {theme}</span>
          <button onClick={toggleTheme}>
            Switch to {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </div>

      {/* Density Section */}
      <div className="settings-section">
        <h3>Density</h3>
        <label>
          Set Density (1 = compact, 3 = spacious):
          <input
            type="number"
            min="1"
            max="3"
            value={density}
            onChange={(e) => setDensity(parseInt(e.target.value))}
          />
        </label>
        <p>Current density: {density}</p>
      </div>
    </div>
  );
}