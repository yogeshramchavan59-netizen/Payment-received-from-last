const express = require('express');
const OrderModel = require('../models/Order');
const { signDownloadToken, verifyDownloadToken } = require('../utils/jwt');
const { getPresignedUrl } = require('../utils/s3');

const router = express.Router();

// get a short-lived download token (call after payment)
router.post('/get-download-token', async (req, res) => {
  try {
    const { razorpayOrderId } = req.body;
    if (!razorpayOrderId) return res.status(400).json({ error: 'razorpayOrderId-required' });

    const order = await OrderModel.findOne({ where: { razorpayOrderId }});
    if (!order) return res.status(404).json({ error: 'order-not-found' });
    if (order.status !== 'paid') return res.status(403).json({ error: 'payment-not-complete' });

    // token payload includes orderId and fileKey
    const token = signDownloadToken({ orderId: order.id, fileKey: order.fileKey }, '10m');
    res.json({ downloadToken: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'token-failed' });
  }
});

// actual download: server returns presigned url; token is single-use
router.get('/download', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ error: 'no-token' });

    const payload = verifyDownloadToken(token);
    const order = await OrderModel.findByPk(payload.orderId);
    if (!order) return res.status(404).json({ error: 'order-not-found' });
    if (order.downloadTokenUsed) return res.status(403).json({ error: 'token-already-used' });

    // mark used
    order.downloadTokenUsed = true;
    await order.save();

    const presigned = await getPresignedUrl(order.fileKey, 300);
    res.json({ url: presigned });
  } catch (err) {
    console.error('download err', err);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'token-expired' });
    res.status(500).json({ error: 'download-failed' });
  }
});

module.exports = router;
