const Book = require('../models/Book');
const Student = require('../models/Student');
const Attendant = require('../models/Attendant');

// CREATE BOOK
exports.createBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.send(book);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// GET ALL BOOKS
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find()
      .populate('authors')
      .populate('borrowedBy')
      .populate('issuedBy');
    res.send(books);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// GET ONE BOOK
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('authors')
      .populate('borrowedBy')
      .populate('issuedBy');

    if (!book) return res.status(404).send("Book not found");

    res.send(book);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// UPDATE BOOK
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).send("Book not found");
    res.send(book);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// DELETE BOOK
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).send("Book not found");
    res.send("Book deleted");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// BORROW BOOK
exports.borrowBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) return res.status(404).send("Book not found");
    if (book.status === "OUT") return res.status(400).send("Book already borrowed");

    book.status = "OUT";
    book.borrowedBy = req.body.studentId;
    book.issuedBy = req.body.attendantId;
    book.returnDate = req.body.returnDate;

    await book.save();
    res.send(book);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// RETURN BOOK
exports.returnBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) return res.status(404).send("Book not found");
    if (book.status === "IN") return res.status(400).send("Book already in library");

    book.status = "IN";
    book.borrowedBy = null;
    book.issuedBy = null;
    book.returnDate = null;

    await book.save();
    res.send(book);
  } catch (err) {
    res.status(500).send(err.message);
  }
};0

