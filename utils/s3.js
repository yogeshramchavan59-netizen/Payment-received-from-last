const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

function getPresignedUrl(key, expiresSeconds = 300) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Expires: expiresSeconds
  };
  return s3.getSignedUrlPromise('getObject', params);
}

module.exports = { getPresignedUrl };
