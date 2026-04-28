Digital Banking Backend API (NibssByPhoenix Integration)

📌 Overview

This project is a backend banking system built using Node.js and Express.
It simulates core banking operations including customer onboarding, account management, and fund transfers.

The system integrates with the NibssByPhoenix API for BVN verification during customer onboarding.

---

🚀 Features

- Customer onboarding with BVN verification
- Automatic account creation
- Initial account funding (₦15,000)
- Intra-bank funds transfer
- Transaction history tracking
- Account balance enquiry
- Name enquiry (account verification before transfer)

---

🔗 NIBSS Integration

This system integrates with the NibssByPhoenix API to validate customer BVN before onboarding.

🔐 Authentication

- API Key and Secret are used to generate a JWT token
- Token is stored as an environment variable

📡 BVN Validation Flow

1. User submits name and BVN
2. Backend sends BVN to NIBSS endpoint:
   POST /api/validateBvn
3. Request is authenticated using Bearer Token
4. If validation is successful:
   - Customer is onboarded
   - Account is created automatically

---

⚙️ Setup Instructions

1. Install dependencies:

npm install

2. Start the server:

node server.js

Server runs on:

http://localhost:3000

---

🔐 Environment Variables

Create a ".env" file and add:

NIBSS_TOKEN=your_generated_token

---

📡 API Endpoints

1. Onboard Customer

POST /onboard

Body:

{
  "name": "A",
  "bvn": "12345678901"
}

- Validates BVN via NIBSS
- Creates account automatically
- Initial balance: ₦15,000

---

2. Get All Customers

GET /customers

---

3. Name Enquiry

GET /name/:accountNumber

Returns account name linked to account number.

---

4. Check Balance

GET /balance/:accountNumber

Example response:

{
  "accountNumber": 2094020597,
  "balance": 14000
}

---

5. Funds Transfer

POST /transfer

Body:

{
  "fromAccount": 2094020597,
  "toAccount": 7190430585,
  "amount": 1000
}

Example response:

{
  "message": "Transfer successful"
}

---

6. Transaction History

GET /transactions/:accountNumber

Returns all transactions for a specific account.

---

🧠 Notes

- Data is stored in-memory (no database used)
- Restarting the server will reset all data
- Axios is used to communicate with NIBSS API
- Only intra-bank transfers are implemented

---

🧪 Testing

You can test endpoints using:

- curl (Terminal)
- Postman

---

✅ Project Status

✔ Fully functional
✔ Meets all assignment requirements
✔ Successfully integrates with NibssByPhoenix API
