// payments.js
const { Client, Environment } = require('square');

const client = new Client({
  environment: Environment.Sandbox, // use Sandbox
  accessToken: process.env.SQUARE_ACCESS_TOKEN // put your sandbox token in .env
});

const paymentsApi = client.paymentsApi;

async function createPayment(nonce, amount, currency = 'USD') {
  try {
    const requestBody = {
      sourceId: nonce, // token from frontend (test card)
      amountMoney: {
        amount: amount, // in cents
        currency: currency
      },
      idempotencyKey: crypto.randomUUID() // unique for each request
    };

    const response = await paymentsApi.createPayment(requestBody);
    return response.result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = { createPayment };
