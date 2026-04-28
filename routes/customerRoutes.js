const express = require('express');
const router = express.Router();

const { customers } = require('../models/db');

// Get all customers
router.get('/', (req, res) => {
  res.json(customers);
});

module.exports = router;
