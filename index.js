const AWS = require('aws-sdk');
const sharp = require('sharp');
const s3 = new AWS.S3();

exports.handler = async (event, context) => {
  // From the upload event, grab the bucket name and the file name
  // the upload has Key: `original-images/${fileName}`,
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

  // Check if the uploaded object is in the 'original-images/' prefix
  if (!key.startsWith('original-images/')) {
    console.log(`Object ${key} is not 'original-images/' prefix. Cancelling upload...`);
    return;
  }

  try {
    // Download the uploaded image from S3
    const params = {
        Bucket: bucket,
        Key: key
      };
    const imageData = await s3.getObject(params).promise();

    // Resize the image using sharp
    const resizedImageBuffer = await sharp(imageData.Body)
      .resize({ width: 500 }) 
      .toBuffer();

    // Need to replace key this way because key has the path and the image file name
    // so it changes original-images/image.jpg to resized-images/image.jpg
    const resizedKey = key.replace('original-images/', 'resized-images/');

    // Upload the resized image back to S3
    await s3.putObject({
      Bucket: bucket,
      Key: resizedKey,
      Body: resizedImageBuffer
    }).promise();

    console.log(`Resized image uploaded to ${resizedKey}`);
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
};
