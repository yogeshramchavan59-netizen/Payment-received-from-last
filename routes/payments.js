const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const OrderModel = require('../models/Order');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// CREATE ORDER - fixed amount ₹5 (500 paise)
router.post('/create-order', async (req, res) => {
  try {
    const { fileKey } = req.body;
    if (!fileKey) return res.status(400).json({ error: 'fileKey-required' });

    const amountPaise = 500; // ₹5 fixed
    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const rOrder = await razorpay.orders.create(options);
    const order = await OrderModel.create({
      razorpayOrderId: rOrder.id,
      amount: amountPaise,
      currency: 'INR',
      status: 'created',
      fileKey
    });

    res.json({ orderId: rOrder.id, amount: amountPaise });
  } catch (err) {
    console.error('create-order err', err);
    res.status(500).json({ error: 'create-order-failed' });
  }
});

// WEBHOOK - verify and mark paid
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'] || '';
    const body = req.rawBody.toString();

    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (expected !== signature) {
      console.warn('Invalid webhook signature');
      return res.status(400).send('invalid signature');
    }

    const payload = req.body;
    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const rOrderId = payment.order_id;
      const order = await OrderModel.findOne({ where: { razorpayOrderId: rOrderId }});
      if (!order) {
        console.warn('Order not found for', rOrderId);
        return res.json({ ok: false });
      }
      order.status = 'paid';
      order.razorpayPaymentId = payment.id;
      await order.save();
      return res.json({ ok: true });
    }
    // other events
    res.json({ ok: true });
  } catch (err) {
    console.error('webhook error', err);
    res.status(500).send('error');
  }
});

module.exports = router;
