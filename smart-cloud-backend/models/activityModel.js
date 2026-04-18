// models/activityModel.js
const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String }, // upload, delete, download, etc.
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  details: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', ActivitySchema);
