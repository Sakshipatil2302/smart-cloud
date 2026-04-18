const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: String,
  size: Number,
  path: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  uploadedAt: { type: Date, default: Date.now },
  classification: { type: String, default: "unknown" },
  sha256: { type: String, index: true }, // for duplicate detection
  textExtract: { type: String, default: "" } // for later search
});

module.exports = mongoose.model("File", fileSchema);
