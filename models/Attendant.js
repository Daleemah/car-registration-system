const mongoose = require('mongoose');

const attendantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  staffId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendant', attendantSchema);0

