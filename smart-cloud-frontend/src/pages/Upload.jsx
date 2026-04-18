import React, { useState } from "react";
import axios from "axios";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setMsg("");
  };

  const fetchUploadedFiles = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await axios.get(`${API}/api/files/list`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      setUploadedFiles(res.data);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMsg("Select a file first");

    const form = new FormData();
    form.append("file", file);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await axios.post(`${API}/api/files/upload`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user?.token}`,
        },
      });

      setMsg("Upload successful ✅");

      // Fetch uploaded files to display immediately
      fetchUploadedFiles();

      // Dispatch event to notify Dashboard (if open)
      window.dispatchEvent(new Event("files-updated"));
    } catch (err) {
      console.error("Upload error:", err);
      setMsg(err.response?.data?.message || "Upload failed. Please try again.");
    }
  };

  // Fetch files on first render
  React.useEffect(() => {
    fetchUploadedFiles();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h3>Upload File</h3>
      <form onSubmit={handleUpload}>
        <input type="file" onChange={handleFile} />
        <div style={{ marginTop: 8 }}>
          <button type="submit">Upload</button>
        </div>
      </form>
      <p>{msg}</p>

      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4>Uploaded Files:</h4>
          <ul>
            {uploadedFiles.map((f, index) => (
              <li key={index}>
                <a href={f.path} target="_blank">
                  {f.storedName} ({Math.round(f.size / 1024)} KB)
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}