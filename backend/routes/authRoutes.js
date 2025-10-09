const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/verify-otp', authController.verifyOtp);


module.exports = router;

router.post('/upload-aadhaar', authController.uploadAadhaar);