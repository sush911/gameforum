const express = require('express');
const router = express.Router();
const { Client, Environment } = require('square');
require('dotenv').config();

const squareClient = new Client({
  environment: Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN
});

router.post('/payments', async (req, res) => {
  try {
    const { sourceId, amount } = req.body;

    const paymentsApi = squareClient.paymentsApi;
    const requestBody = {
      sourceId,
      idempotencyKey: require('crypto').randomUUID(),
      amountMoney: {
        amount: parseInt(amount),
        currency: 'USD'
      }
    };

    const response = await paymentsApi.createPayment(requestBody);
    res.json({ success: true, payment: response.result.payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
