const express = require('express');
const router = express.Router();

const { customers } = require('../models/db');
const { transactions } = require('../models/transactions');

// Transfer money
router.post('/', (req, res) => {
  const { fromAccount, toAccount, amount } = req.body;

  const sender = customers.find(c => c.accountNumber == fromAccount);
  const receiver = customers.find(c => c.accountNumber == toAccount);

  if (!sender || !receiver) {
    return res.json({ message: "Invalid account number" });
  }

  if (sender.balance < amount) {
    return res.json({ message: "Insufficient balance" });
  }

  sender.balance -= amount;
  receiver.balance += amount;

  // Save transaction
  transactions.push({
    from: sender.accountNumber,
    to: receiver.accountNumber,
    amount,
    date: new Date().toISOString()
  });

  res.json({
    message: "Transfer successful",
    sender,
    receiver
  });
});

module.exports = router;
