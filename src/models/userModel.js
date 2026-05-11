const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  nin: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'staff', 'admin'],
    default: 'user',
  },
}, { timestamps: true });

userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

userSchema.methods.matchPassword = async 

module.exports = mongoose.model('User', userSchema);