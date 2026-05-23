const express = require('express');
const router = express.Router();

const { transactions } = require('../models/transactions');

router.get('/:accountNumber', (req, res) => {
  const account = req.params.accountNumber;

  const history = transactions.filter(
    t => t.from == account || t.to == account
  );

  res.json(history);
});

module.exports = router;
