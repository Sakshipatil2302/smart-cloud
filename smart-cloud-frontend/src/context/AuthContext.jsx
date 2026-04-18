// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  // On mount, load user from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch (err) {
        console.warn("Failed to parse stored user, clearing:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("favorites"); // clear favorites for safety
      }
    } else {
      const token = localStorage.getItem("token");
      if (token && !raw) {
        setCurrentUser({ token });
      }
    }
  }, []);

  // Login function
  const login = (user) => {
    if (!user) return;

    // Clear previous user data before login
    localStorage.removeItem("favorites");

    // Persist token
    if (user.token) {
      try {
        localStorage.setItem("token", user.token);
      } catch (err) {
        console.warn("Failed to save token to localStorage:", err);
      }
    }

    // Persist full user object
    try {
      localStorage.setItem("user", JSON.stringify(user));
    } catch (err) {
      console.warn("Failed to save user to localStorage:", err);
    }

    // Update context state
    setCurrentUser(user);
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("favorites"); // clear favorites on logout
    } catch (err) {
      console.warn("Failed to clear localStorage:", err);
    }
  };

  // Auth check
  const isAuthenticated = () => !!currentUser?.token;

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}