// routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");

/* ================= PATHS ================= */
const uploadFolder = path.join(__dirname, "..", "uploads");
const trashFolder = path.join(__dirname, "..", "trash");
const dataFile = path.join(__dirname, "..", "fileData.json");

/* ================= CREATE REQUIRED FOLDERS ================= */
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });
if (!fs.existsSync(trashFolder)) fs.mkdirSync(trashFolder, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]");

/* ================= JSON HELPERS ================= */
const readFileData = () => {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    return [];
  }
};

const writeFileData = (data) =>
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

/* ================= MULTER STORAGE ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ================= UPLOAD ================= */
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "Upload failed" });

  const filesData = readFileData();
  const originalName = req.file.originalname;
  const filePath = path.join(uploadFolder, req.file.filename);
  const ext = path.extname(originalName).toLowerCase();

  /* ================= TEXT EXTRACTION ================= */
  let content = "";
  try {
    if (ext === ".pdf") {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      content = (data.text || "").trim();
      if (!content || content.length < 10) {
        const result = await Tesseract.recognize(filePath, "eng");
        content = (result.data.text || "").trim();
      }
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      content = (result.value || "").replace(/\s+/g, " ").trim();
      if (!content || content.length < 10) {
        const resultOCR = await Tesseract.recognize(filePath, "eng");
        content = (resultOCR.data.text || "").trim();
      }
    } else if (ext === ".txt") {
      content = fs.readFileSync(filePath, "utf8").trim();
    } else if ([".jpg", ".jpeg", ".png", ".bmp"].includes(ext)) {
      const result = await Tesseract.recognize(filePath, "eng");
      content = (result.data.text || "").trim();
    }
  } catch (err) {
    console.error("Text extraction error:", err);
  }

  if (!content || content.length === 0) {
    content = originalName.toLowerCase();
  }

  /* ================= AUTO-CLASSIFICATION ================= */
  let category = "other";
  if (ext === ".pdf") category = "pdf";
  else if (ext === ".docx") category = "docx";
  else if (ext === ".txt") category = "txt";
  else if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext)) category = "image";
  else if ([".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext)) category = "video";

  const lowerContent = content.toLowerCase();
  if (["pdf", "docx", "txt"].includes(category)) {
    if (lowerContent.includes("invoice")) category = "invoice";
    else if (lowerContent.includes("report")) category = "report";
  }

  /* ================= DUPLICATE HANDLING ================= */
  const duplicateIndex = filesData.findIndex(
    (f) =>
      f.originalName.toLowerCase() === originalName.toLowerCase() &&
      f.userEmail === req.body.userEmail
  );

  if (duplicateIndex !== -1 && !req.body.replace) {
    fs.unlinkSync(filePath);
    return res.status(409).json({ duplicate: true });
  }

  if (duplicateIndex !== -1 && req.body.replace) {
    const oldPath = path.join(uploadFolder, filesData[duplicateIndex].storedName);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    filesData.splice(duplicateIndex, 1);
  }

  /* ================= SAVE FILE INFO ================= */
  const fileInfo = {
    storedName: req.file.filename,
    originalName,
    content,
    category,
    userEmail: req.body.userEmail, // store uploader email
  };

  filesData.push(fileInfo);
  writeFileData(filesData);

  res.json({
    success: true,
    file: {
      storedName: req.file.filename,
      originalName,
      path: `/uploads/${req.file.filename}`,
      category,
    },
  });
});

/* ================= LIST FILES ================= */
router.get("/list", (req, res) => {
  const filesData = readFileData();
  const userEmail = req.query.userEmail;

  const files = filesData
    .filter((f) => f.userEmail === userEmail)
    .map((file) => {
      const filePath = path.join(uploadFolder, file.storedName);
      return {
        storedName: file.storedName,
        originalName: file.originalName,
        path: `/uploads/${file.storedName}`,
        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
        category: file.category || "other",
      };
    });

  res.json(files);
});

/* ================= DELETE TO TRASH ================= */
router.delete("/delete/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filesData = readFileData();
  const index = filesData.findIndex((f) => f.storedName === filename);

  if (index === -1)
    return res.status(404).json({ success: false, message: "File not found" });

  const src = path.join(uploadFolder, filename);
  const destName = filesData[index].originalName; // preserve original filename
  const destPath = path.join(trashFolder, destName);

  let finalDest = destPath;
  if (fs.existsSync(destPath)) {
    const name = path.parse(destName).name;
    const ext = path.parse(destName).ext;
    finalDest = path.join(trashFolder, `${name}-${Date.now()}${ext}`);
  }

  try {
    if (fs.existsSync(src)) fs.renameSync(src, finalDest);

    filesData.splice(index, 1);
    writeFileData(filesData);

    res.json({ success: true, originalName: destName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ================= TRASH LIST ================= */
router.get("/trash", (req, res) => {
  const files = fs.readdirSync(trashFolder);

  const trashData = files.map((file) => {
    const filePath = path.join(trashFolder, file);
    return {
      storedName: file,
      originalName: file,
      path: `/trash/${file}`,
      size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
    };
  });

  res.json(trashData);
});

/* ================= PERMANENT DELETE ================= */
router.delete("/trash/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(trashFolder, filename);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ success: false });

  fs.unlinkSync(filePath);
  res.json({ success: true });
});

/* ================= SEARCH ================= */
router.get("/search", (req, res) => {
  const query = (req.query.q || "").toLowerCase().trim();
  const filesData = readFileData();
  const userEmail = req.query.userEmail;

  if (!userEmail)
    return res.status(400).json({ success: false, message: "userEmail required" });

  if (!query) {
    return res.json(filesData.filter(f => f.userEmail === userEmail));
  }

  const words = query.split(/\s+/);

  const results = filesData.filter((file) => {
    if (file.userEmail !== userEmail) return false;
    const name = (file.originalName || "").toLowerCase();
    const content = (file.content || "").toLowerCase();
    const stored = (file.storedName || "").toLowerCase();

    // search in name, content, storedName, and category
    return words.some(
      (word) =>
        name.includes(word) ||
        content.includes(word) ||
        stored.includes(word) ||
        (file.category || "").toLowerCase().includes(word)
    );
  });

  res.json(results);
});

module.exports = router;