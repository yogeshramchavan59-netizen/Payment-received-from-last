const jwt = require('jsonwebtoken');

function signDownloadToken(payload, expiresIn = '10m') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function verifyDownloadToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signDownloadToken, verifyDownloadToken };
