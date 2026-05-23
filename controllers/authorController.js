const Author = require('../models/Author');

// CREATE AUTHOR
exports.createAuthor = async (req, res) => {
  try {
    const author = await Author.create(req.body);
    res.send(author);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// GET ALL AUTHORS
exports.getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.find();
    res.send(authors);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// GET SINGLE AUTHOR
exports.getAuthorById = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).send("Author not found");
    res.send(author);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// UPDATE AUTHOR
exports.updateAuthor = async (req, res) => {
  try {
    const author = await Author.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!author) return res.status(404).send("Author not found");
    res.send(author);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// DELETE AUTHOR
exports.deleteAuthor = async (req, res) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) return res.status(404).send("Author not found");
    res.send("Author deleted");
  } catch (err) {
    res.status(500).send(err.message);
  }
};0

