const express = require('express');
const router = express.Router();
const { customers } = require('../models/db');

router.get('/:accountNumber', (req, res) => {
  const customer = customers.find(
    c => c.accountNumber == req.params.accountNumber
  );

  if (!customer) {
    return res.json({ message: "Account not found" });
  }

  res.json({
    accountNumber: customer.accountNumber,
    name: customer.name
  });
});

module.exports = router;
