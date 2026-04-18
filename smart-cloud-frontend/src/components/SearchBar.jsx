// src/components/SearchBar.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../styles/searchBar.css";

export default function SearchBar({ API, token, onResults, view = "all", favorites = [], userEmail }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  // Build headers for API requests
  const buildHeaders = useCallback(() => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [token]);

  // Debounce function to avoid too many API calls
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  // Search function
  const searchFiles = async (q) => {
    setQuery(q);
    if (!q) return onResults([]);

    if (!userEmail) return setError("User email missing");

    try {
      const res = await axios.get(`${API}/api/files/search`, {
        params: { q, userEmail },
        headers: buildHeaders(),
      });

      let list = Array.isArray(res.data) ? res.data : res.data.files || [];

      // Filter favorites if the view is 'favorites'
      if (view === "favorites") list = list.filter((f) => favorites.includes(f.storedName));

      onResults(list);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed");
    }
  };

  // Debounced version of search
  const debouncedSearch = useCallback(debounce(searchFiles, 300), [userEmail, view, favorites, buildHeaders]);

  // Voice search
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return setError("Voice search not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    recognition.onresult = (event) => debouncedSearch(event.results[0][0].transcript);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search files..."
        value={query}
        onChange={(e) => debouncedSearch(e.target.value)}
      />
      <button onClick={handleVoiceSearch} title="Voice Search">🎤</button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}