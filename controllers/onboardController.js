const axios = require('axios');
const { customers } = require('../models/db');

const onboardCustomer = async (req, res) => {
  const { name, bvn } = req.body;

  if (!name || !bvn) {
    return res.json({ message: "Name and BVN required" });
  }

  const token = process.env.NIBSS_TOKEN;

  try {
    // 1. Validate BVN
    await axios.post(
      'https://nibssbyphoenix.onrender.com/api/validateBvn',
      { bvn },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("BVN validated");

  } catch (error) {
    console.log(error.response?.data || error.message);
    return res.json({ message: "BVN verification failed" });
  }

  // 2. Create local customer
  const newCustomer = {
    id: Date.now(),
    name,
    bvn,
    accountNumber: Math.floor(1000000000 + Math.random() * 9000000000),
    balance: 15000,
    status: "active"
  };

  customers.push(newCustomer);

  // 3. Response
  res.json({
    message: "Customer onboarded successfully",
    customer: newCustomer
  });
};

module.exports = { onboardCustomer };
