const Student = require('../models/Student');

// CREATE STUDENT
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.send(student);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// GET ALL STUDENTS
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.send(students);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// GET ONE STUDENT
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).send("Student not found");
    res.send(student);
  } catch (err) {
    res.status(500).send(err.message);
  }
};0

