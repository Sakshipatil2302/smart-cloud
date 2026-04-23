// src/pages/Dashboard.jsx
import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import Settings from "./Settings";
import axios from "axios";
import "../styles/dashboard.css";
import { AuthContext } from "../context/AuthContext";
import UserMenu from "../components/UserMenu";

export default function Dashboard() {
  const { currentUser } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [view, setView] = useState("all"); // all, myfiles, recent, trash, favorites, categories
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const fileInputRef = useRef(null);

  // Load favorites from localStorage
  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(favs);
  }, [currentUser?.email]);

  const buildHeaders = useCallback(() => {
    const headers = {};
    if (currentUser?.token) headers["Authorization"] = `Bearer ${currentUser.token}`;
    return headers;
  }, [currentUser]);

  // Fetch files from backend
  const fetchList = useCallback(async () => {
    if (!currentUser?.token) return;
    setLoading(true);
    setError("");

    try {
      let endpoint = `${API}/api/files/list`;
      if (view === "trash") endpoint = `${API}/api/files/trash`;

      const res = await axios.get(endpoint, {
        params: { userEmail: currentUser.email },
        headers: buildHeaders(),
      });

      let list = Array.isArray(res.data) ? res.data : res.data.files || [];

      // Filter by view
      switch (view) {
        case "recent":
          list = list
            .sort((a, b) => parseInt(b.storedName.split("-")[0]) - parseInt(a.storedName.split("-")[0]))
            .slice(0, 10);
          break;
        case "favorites":
          list = list.filter(f => favorites.includes(f.storedName));
          break;
        case "pdf":
        case "docx":
        case "txt":
        case "invoice":
        case "report":
        case "image":
        case "video":
          list = list.filter(f => f.category === view);
          break;
        default:
          break; // "all" or unknown view
      }

      setFiles(list);
    } catch (err) {
      console.error("fetchList error:", err);
      setError("Could not fetch files.");
    } finally {
      setLoading(false);
    }
  }, [API, buildHeaders, view, currentUser, favorites]);

  useEffect(() => {
    fetchList();
  }, [fetchList, view, favorites, currentUser?.email]);

  // Highlight search query in file names
  const highlightText = (text, query) => {
    if (!query) return text;
    const words = query.toLowerCase().split(/\s+/);
    let highlighted = text;
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, "gi");
      highlighted = highlighted.replace(regex, `<span class="highlight">$1</span>`);
    });
    return highlighted;
  };

  // Search
  const handleSearch = async (q) => {
    if (!currentUser?.token) return;
    setSearchQuery(q);

    try {
      const res = await axios.get(`${API}/api/files/search`, {
        params: { q, userEmail: currentUser.email },
        headers: buildHeaders(),
      });

      let list = Array.isArray(res.data) ? res.data : res.data.files || [];
      if (view === "favorites") list = list.filter(f => favorites.includes(f.storedName));
      setFiles(list);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed");
    }
  };
const handleVoiceSearch = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setError("Voice search not supported in this browser");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onstart = () => {
    console.log("Voice started");
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    console.log("You said:", text);
    handleSearch(text); // 🔥 connect to your search
  };

  recognition.onerror = (event) => {
    console.error("Voice error:", event.error);
    setError("Microphone error: " + event.error);
  };

  recognition.start();
};

  // Upload
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("userEmail", currentUser.email);

    try {
      const res = await axios.post(`${API}/api/files/upload`, fd, {
        headers: { ...buildHeaders(), "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) fetchList();
    } catch (err) {
      if (err.response?.status === 409) {
        const confirmReplace = window.confirm("Duplicate file exists. Replace it?");
        if (confirmReplace) {
          const fdReplace = new FormData();
          fdReplace.append("file", file);
          fdReplace.append("replace", true);
          fdReplace.append("userEmail", currentUser.email);
          await axios.post(`${API}/api/files/upload`, fdReplace, {
            headers: { ...buildHeaders(), "Content-Type": "multipart/form-data" }
          });
          fetchList();
        }
      } else {
        console.error("Upload error:", err);
        setError("Upload failed");
      }
    }
    e.target.value = "";
  };

  // Delete
  const handleDelete = async file => {
    try {
      await axios.delete(`${API}/api/files/delete/${encodeURIComponent(file.storedName)}`, {
        headers: buildHeaders()
      });
      fetchList();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Delete failed");
    }
  };

  const handlePermanentDelete = async file => {
    try {
      await axios.delete(`${API}/api/files/trash/${encodeURIComponent(file.storedName)}`, {
        headers: buildHeaders()
      });
      fetchList();
    } catch (err) {
      console.error("Permanent delete error:", err);
      setError("Failed to delete permanently");
    }
  };

  // Favorites
  const toggleFavorite = file => {
    let updatedFavs = [...favorites];
    let isAdded = false;
    if (favorites.includes(file.storedName)) {
      updatedFavs = updatedFavs.filter(f => f !== file.storedName);
    } else {
      updatedFavs.push(file.storedName);
      isAdded = true;
    }
    setFavorites(updatedFavs);
    localStorage.setItem("favorites", JSON.stringify(updatedFavs));
    if (isAdded) setView("favorites");
  };

  return (
    <div className="dash-app">
      <Sidebar onNav={setView} onUploadClick={handleUploadClick} />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
      <main className="dash-main">
        <header className="dash-header">
                <SearchBar
        API={API}
        token={currentUser?.token}
        view={view}
        favorites={favorites}
        userEmail={currentUser?.email}
        onResults={(results) => setFiles(results)}
      />
          <UserMenu />
        </header>

        {error && <div className="error">{error}</div>}

        {view === "settings" ? (
          <Settings />
        ) : (
          <>
            {/* CATEGORY FILTER BUTTONS */}
            <div className="category-filter">
              <button onClick={() => setView("all")}>All</button>
              <button onClick={() => setView("pdf")}>PDF</button>
              <button onClick={() => setView("docx")}>DOCX</button>
              <button onClick={() => setView("txt")}>TXT</button>
              <button onClick={() => setView("image")}>Image</button>
              <button onClick={() => setView("video")}>Video</button>
              <button onClick={() => setView("invoice")}>Invoice</button>
              <button onClick={() => setView("report")}>Report</button>
            </div>

            {/* FILE GRID */}
            <section className="file-grid">
              {loading ? (
                <div>Loading files...</div>
              ) : files.length === 0 ? (
                <div>No files uploaded</div>
              ) : (
                files.map((f) => (
                  <div key={f.storedName} className="file-card">
                    <a
                      href={`http://localhost:5000/uploads/${f.storedName}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span dangerouslySetInnerHTML={{ __html: highlightText(f.originalName, searchQuery) }} />
                    </a>

                    <p className="file-category">{f.category || "other"}</p>

                    <div className="file-actions">
                      <span
                        className={`favorite-star ${favorites.includes(f.storedName) ? "active" : ""}`}
                        onClick={() => toggleFavorite(f)}
                        title={favorites.includes(f.storedName) ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        ⭐
                      </span>

                      {view === "trash" ? (
                        <button className="delete-btn" onClick={() => handlePermanentDelete(f)} title="Permanent Delete">❌</button>
                      ) : (
                        <button className="delete-btn" onClick={() => handleDelete(f)} title="Delete">🗑</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}