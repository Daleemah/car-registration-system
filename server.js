const express = require('express');
const authorRoutes = require('./routes/authorRoutes');
const bookRoutes = require('./routes/bookRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendantRoutes = require('./routes/attendantRoutes');

const app = express();
app.use(express.json());

// MongoDB connection
const mongoose = require('mongoose');

const uri ="mongodb+srv://adelanihalimah5_db_user:adelanihalimah5_db_user@cluster0.pseblcn.mongodb.net/sample_mflix?retryWrites=true&w=majority";
mongoose.connect(uri)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
app.use('/authors', authorRoutes);
app.use('/books', bookRoutes);
app.use('/students', studentRoutes);
app.use('/attendants', attendantRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));0

