const Attendant = require('../models/Attendant');

// CREATE ATTENDANT
exports.createAttendant = async (req, res) => {
  try {
    const attendant = await Attendant.create(req.body);
    res.send(attendant);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// GET ALL ATTENDANTS
exports.getAllAttendants = async (req, res) => {
  try {
    const attendants = await Attendant.find();
    res.send(attendants);
  } catch (err) {
    res.status(500).send(err.message);
  }
};0

