const cloudinary = require('cloudinary').v2;

// DIRECT CONFIGURATION (Bypassing .env to fix the error)
cloudinary.config({
  cloud_name: 'dali9vca2', 
  api_key: '597255794321466', 
  api_secret: 'MsbMt8Bsk63XHVEWDj75G36CicY' 
});

module.exports = cloudinary;
