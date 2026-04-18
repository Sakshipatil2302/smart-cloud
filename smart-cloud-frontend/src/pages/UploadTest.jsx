import React, { useState } from "react";
import axios from "axios";

export default function UploadTest() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleFile = (e) => setFile(e.target.files[0]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMsg("Choose a file first");

    const form = new FormData();
    form.append("file", file);

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      await axios.post(`${API}/api/files/upload`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user?.token}`,
        },
      });

      setMsg("Upload successful ✅");
    } catch (err) {
      console.error("Upload error:", err);
      setMsg(err.response?.data?.message || "Upload failed. Please try again.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Upload Test</h3>
      <form onSubmit={handleUpload}>
        <input type="file" onChange={handleFile} />
        <button type="submit">Upload</button>
      </form>
      <pre>{msg}</pre>
    </div>
  );
}