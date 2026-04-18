// src/components/FileCard.jsx
import React, { useState } from "react";
import "../styles/filecard.css";
import axios from "axios";

export default function FileCard({ file, fetchList, inTrash, favorites, setFavorites }) {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Favorite toggle
  const toggleFavorite = () => {
    let updated = [];
    if (favorites.includes(file._id)) {
      updated = favorites.filter(f => f !== file._id);
    } else {
      updated = [...favorites, file._id];
    }
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const isFavorite = favorites.includes(file._id);

  // Soft delete
  const handleDelete = async () => {
    if (!window.confirm(`Move ${file.originalName} to Trash?`)) return;
    try {
      await axios.delete(`${API}/api/files/${file._id}`);
      fetchList();
    } catch (err) {
      console.error(err);
      alert("Failed to delete file");
    }
  };

  // Permanent delete
  const handlePermanentDelete = async () => {
    if (!window.confirm(`Permanently delete ${file.originalName}?`)) return;
    try {
      await axios.delete(`${API}/api/files/trash/${file._id}`);
      fetchList();
    } catch (err) {
      console.error(err);
      alert("Failed to delete file permanently");
    }
  };

  return (
    <div className="file-card">
      <div className="file-name">{file.originalName}</div>
      <div className="file-category">{file.category}</div>
      <div className="file-date">{new Date(file.uploadedAt).toLocaleString()}</div>

      <div className="file-actions">
        {!inTrash && (
          <button
            className={`favorite-btn ${isFavorite ? "active" : ""}`}
            onClick={toggleFavorite}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            ⭐
          </button>
        )}

        {!inTrash && (
          <button className="file-delete-btn" onClick={handleDelete}>
            🗑 Delete
          </button>
        )}

        {inTrash && (
          <button className="file-delete-btn" onClick={handlePermanentDelete}>
            ❌ Delete Permanently
          </button>
        )}
      </div>
    </div>
  );
}