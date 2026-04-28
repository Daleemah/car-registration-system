const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Banking API is running');
});

const onboardRoutes = require('./routes/onboardRoutes');
app.use('/onboard', onboardRoutes);

const customerRoutes = require('./routes/customerRoutes');
app.use('/customers', customerRoutes);

const transferRoutes = require('./routes/transferRoutes');
app.use('/transfer', transferRoutes);

const transactionRoutes = require('./routes/transactionRoutes');
app.use('/transactions', transactionRoutes);

const balanceRoutes = require('./routes/balanceRoutes');
app.use('/balance', balanceRoutes);

const nameRoutes = require('./routes/nameEnquiryRoutes');
app.use('/name', nameRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
})
