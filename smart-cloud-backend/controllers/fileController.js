const fs = require("fs");
const path = require("path");

// Upload file handler
exports.uploadFile = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // Auto-categorize based on MIME type
  const mime = req.file.mimetype;
  let category = "";
  if (mime.startsWith("image/")) category = "Image";
  else if (mime.startsWith("video/")) category = "Video";
  else if (mime.startsWith("audio/")) category = "Audio";
  else category = "Other";

  // Optionally, save file info to database (MongoDB)
  // const newFile = new FileModel({ name: req.file.originalname, path: req.file.path, category });
  // newFile.save();

  res.json({
    message: "File uploaded successfully",
    fileName: req.file.originalname,
    storedName: req.file.filename,
    category,
    path: req.file.path,
  });
};

// List all uploaded files
exports.listFiles = (req, res) => {
  const dir = path.join(__dirname, "..", "uploads");
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });

    // Optional: include file category based on MIME type
    const fileList = files.map((file) => {
      const ext = path.extname(file).toLowerCase();
      let category = "Other";
      if ([".png", ".jpg", ".jpeg", ".gif"].includes(ext)) category = "Image";
      else if ([".mp4", ".mkv", ".mov"].includes(ext)) category = "Video";
      else if ([".mp3", ".wav"].includes(ext)) category = "Audio";

      return { file, category, path: `/uploads/${file}` };
    });

    res.json(fileList);
  });
};

// Search files by name
exports.searchFiles = (req, res) => {
  const query = req.query.q?.toLowerCase();
  if (!query) return res.status(400).json({ error: "Query missing" });

  const dir = path.join(__dirname, "..", "uploads");
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const results = files
      .filter((file) => file.toLowerCase().includes(query))
      .map((file) => {
        const ext = path.extname(file).toLowerCase();
        let category = "Other";
        if ([".png", ".jpg", ".jpeg", ".gif"].includes(ext)) category = "Image";
        else if ([".mp4", ".mkv", ".mov"].includes(ext)) category = "Video";
        else if ([".mp3", ".wav"].includes(ext)) category = "Audio";

        return { file, category, path: `/uploads/${file}` };
      });

    res.json(results);
  });
};
