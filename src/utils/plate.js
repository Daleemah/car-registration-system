const crypto = require("crypto");

function normalizePlate(plate) {
  return String(plate || "").replace(/\s+/g, "").toUpperCase();
}

function generatePlate(prefix = "AR") {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${rand}`;
}

module.exports = { generatePlate, normalizePlate };
