const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth'); // Import the auth middleware
const multer = require('multer'); // Import multer

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/verify-otp', authController.verifyOtp);

// New route for Aadhaar upload
// 1. 'auth' middleware runs first to check for a valid JWT token.
// 2. 'upload.single('aadhaarCard')' middleware handles the single file upload.
//    The frontend must send the file with the field name 'aadhaarCard'.
router.post(
  '/upload-aadhaar',
  auth,
  upload.single('aadhaarCard'),
  authController.uploadAadhaar
);

module.exports = router;

router.post('/upload-aadhaar', authController.uploadAadhaar);