const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const { ApiError } = require("../utils/ApiError");

const SALT_ROUNDS = 10;

async function register(email, fullName, password) {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email is already registered");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, fullName, passwordHash });

  return { _id: user._id, email: user.email, fullName: user.fullName, role: user.role };
}

async function login(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid credentials");
  if (!user.isActive) throw new ApiError(403, "Account is deactivated");

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new ApiError(401, "Invalid credentials");

  const token = jwt.sign(
    { sub: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );

  return {
    token,
    user: { _id: user._id, email: user.email, fullName: user.fullName, role: user.role },
  };
}

module.exports = { register, login };
