const User = require('../models/user');
const Otp = require('../models/otp');
const sendOTPEmail = require('../utils/sendEmail');

// Controller for the /signup route
exports.signup = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists. Please sign in.' });
    }

    // 2. Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save the OTP to the database
    await Otp.create({ email, code: otpCode });

    // 4. Send the OTP to the user's email
    await sendOTPEmail(email, otpCode);

    // 5. Send a success response
    res.status(200).json({ message: 'OTP sent to your email for verification.' });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup.' });
  }
};

// Controller for the /signin route

exports.signin = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if a user with this email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up first.' });
    }

    // 2. Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save or update the OTP for this email to ensure only the latest one is valid
    await Otp.findOneAndUpdate(
      { email },
      { code: otpCode, createdAt: Date.now() }, // Update code and reset expiry timer
      { upsert: true } // If no OTP doc exists for the email, create one
    );

    // 4. Send the OTP to the user's email
    await sendOTPEmail(email, otpCode);

    // 5. Send a success response
    res.status(200).json({ message: 'OTP sent to your email for verification.' });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error during signin.' });
  }
};


const jwt = require('jsonwebtoken');

// Controller for the /verify-otp route
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // 1. Find the OTP in the database for the given email
    const otpDoc = await Otp.findOne({ email, code: otp });

    // 2. If no matching OTP is found, it's invalid
    if (!otpDoc) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // 3. Find the user by email. If they don't exist, create a new account.
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }

    // 4. The OTP is valid, so we can delete it to prevent reuse
    await Otp.deleteOne({ _id: otpDoc._id });

    // 5. Create a JWT token containing the user's ID
    const token = jwt.sign(
      { userId: user._id }, // Payload
      process.env.JWT_SECRET, // Secret key from .env file
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // 6. Send the token and user info back to the client
    res.status(200).json({
      message: 'Authentication successful!',
      token,
      user: {
        _id: user._id,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification.' });
  }
};





























// const User = require('../models/User');
// const sendOTPEmail = require('../utils/sendEmail');
// const jwt = require('jsonwebtoken');

// exports.signup = async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: 'Email is required' });

//   const existingUser = await User.findOne({ email });
//   if (existingUser) return res.status(409).json({ message: 'User already exists' });

//   const user = new User({ email });
//   await user.save();

//   res.json({ message: 'Signup successful, proceed to Aadhaar upload' });
// };

// exports.signin = async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: 'Email is required' });

//   const user = await User.findOne({ email });
//   if (!user) return res.status(404).json({ message: 'User not found' });

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();

//   user.otp = otp;
//   user.otpExpiry = Date.now() + 5 * 60 * 1000;
//   await user.save();

//   await sendOTPEmail(email, otp);

//   res.json({ message: 'OTP sent to your email' });
// };


// exports.verifyOtp = async (req, res) => {
//   const { email, otp } = req.body;
//   if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

//   const user = await User.findOne({ email });
//   if (!user) return res.status(404).json({ message: 'User not found' });

//   if (user.otp !== otp) return res.status(401).json({ message: 'Invalid OTP' });
//   if (Date.now() > user.otpExpiry) return res.status(410).json({ message: 'OTP expired' });

//   user.otp = undefined;
//   user.otpExpiry = undefined;
//   await user.save();

//   // Generate JWT token
//   const token = jwt.sign(
//     { userId: user._id, email: user.email },
//     process.env.JWT_SECRET,
//     { expiresIn: '7d' } // token valid for 7 days
//   );

//   res.json({ message: 'OTP verified, user authenticated', token });
// };

