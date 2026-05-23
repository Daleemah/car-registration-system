const express = require('express');
const router = express.Router();

const { onboardCustomer } = require('../controllers/onboardController');

router.post('/', onboardCustomer);

module.exports = router;
