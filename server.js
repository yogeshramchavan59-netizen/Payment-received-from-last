require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const payments = require('./routes/payments');
const files = require('./routes/files');
const db = require('./config/db');

const app = express();

// Keep raw body for webhook verification
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf } }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet());
app.use(cors({
  origin: '*' // Change to your Blogger domain in prod
}));

// Basic rate limit
app.use(rateLimit({ windowMs: 15*60*1000, max: 400 }));

app.use('/api/payments', payments);
app.use('/api/files', files);

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

db.authenticate().then(()=> {
  console.log('DB connected');
  return db.sync();
}).then(()=> {
  app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
}).catch(err => {
  console.error('Failed to start', err);
});
