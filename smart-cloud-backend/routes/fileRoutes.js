const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadFolder = path.join(__dirname, "..", "uploads");
const trashFolder = path.join(__dirname, "..", "trash");
const dataFile = path.join(__dirname, "..", "fileData.json");

// Ensure folders & fileData.json
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });
if (!fs.existsSync(trashFolder)) fs.mkdirSync(trashFolder, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]");

// Helpers
const readData = () => JSON.parse(fs.readFileSync(dataFile, "utf-8"));
const writeData = (data) => fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

// Multer setup
const storage = multer.diskStorage({
  destination: uploadFolder,
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ---------------- Upload ----------------
router.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const data = readData();
  data.push({ storedName: file.filename, originalName: file.originalname });
  writeData(data);

  res.json({
    success: true,
    file: {
      storedName: file.filename,
      originalName: file.originalname,
      path: `/uploads/${file.filename}`,
      size: file.size,
      type: file.mimetype,
    },
  });
});

// ---------------- List ----------------
router.get("/list", (req, res) => {
  const data = readData().filter(f => fs.existsSync(path.join(uploadFolder, f.storedName)));
  const files = data.map(f => ({
    storedName: f.storedName,
    originalName: f.originalName,
    path: `/uploads/${f.storedName}`,
    size: fs.statSync(path.join(uploadFolder, f.storedName)).size,
  }));
  res.json({ files }); // send as { files: [...] } to match frontend
});

// ---------------- Trash ----------------
router.delete("/delete/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadFolder, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "File not found" });

  const trashPath = path.join(trashFolder, filename);
  fs.renameSync(filePath, trashPath);

  res.json({ success: true, message: "Moved to trash" });
});

router.get("/trash", (req, res) => {
  const data = readData().filter(f => fs.existsSync(path.join(trashFolder, f.storedName)));
  const files = data.map(f => ({
    storedName: f.storedName,
    originalName: f.originalName,
    path: `/trash/${f.storedName}`,
    size: fs.statSync(path.join(trashFolder, f.storedName)).size,
  }));
  res.json({ files });
});

// ---------------- Permanent delete ----------------
router.delete("/trash/:filename", (req, res) => {
  const { filename } = req.params;
  const trashPath = path.join(trashFolder, filename);
  if (!fs.existsSync(trashPath)) return res.status(404).json({ success: false, message: "File not found in trash" });

  fs.unlinkSync(trashPath);
  res.json({ success: true, message: "Deleted permanently" });
});

module.exports = router;