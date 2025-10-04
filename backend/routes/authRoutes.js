// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { sendOTPEmail } = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Needed for hashing the OTP

// Helper function to generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// =============================================================
// ROUTE 1: Send OTP to Email (Used for both initial Signup and Signin)
// POST /api/auth/send-otp
// =============================================================
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ msg: 'Email is required' });
    }

    try {
        // 1. Generate OTP and expiry time (5 minutes)
        const otp = generateOTP();
        const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes from now

        // 2. Hash the OTP (for security, never store plain text OTP)
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // 3. Find user or create a temporary user if they are signing up for the first time
        let user = await User.findOne({ email });

        if (!user) {
            // For a new user, create a temporary entry with only email and OTP
            user = new User({ email, otp: hashedOtp, otpExpires });
            await user.save();
        } else {
            // For an existing user (signin or returning to signup), update OTP fields
            user.otp = hashedOtp;
            user.otpExpires = otpExpires;
            await user.save();
        }

        // 4. Send the OTP via email
        const emailSent = await sendOTPEmail(email, otp);

        if (emailSent) {
            res.json({ msg: 'OTP sent to email successfully. Expires in 5 minutes.', isNewUser: !user.name });
        } else {
            res.status(500).json({ msg: 'Failed to send OTP email.' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// =============================================================
// ROUTE 2: Verify OTP and Grant Access (for both Signup and Signin)
// POST /api/auth/verify-otp
// =============================================================
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ msg: 'Email and OTP are required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // 1. Check if OTP has expired
        if (user.otpExpires < Date.now()) {
            // Clear expired OTP fields
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
        }

        // 2. Compare the provided OTP with the hashed OTP in the DB
        const isMatch = await bcrypt.compare(otp, user.otp || '');

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        // 3. OTP is valid! Clear the OTP fields
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // 4. Check if the user is fully registered (has a name).
        const isFullyRegistered = !!user.name;

        if (!isFullyRegistered) {
            // SIGNUP FLOW: OTP verification successful, but user needs to complete profile (Aadhaar/Name/Location)
            // We don't issue a full token yet, but a temporary one to secure the next step.
            const payload = { user: { id: user.id, status: 'pending_profile' } };
            
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '15m' }, // Short expiry for profile completion
                (err, token) => {
                    if (err) throw err;
                    // Send status to frontend to proceed to the Aadhaar/Profile form
                    res.json({ token, msg: 'OTP verified. Proceed to profile completion.', userStatus: 'incomplete' });
                }
            );
        } else {
            // SIGNIN FLOW: User is fully registered, issue a full JWT token
            const payload = { user: { id: user.id, status: 'active' } };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' }, // Standard token expiry
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, msg: 'Login successful. Redirecting to Profile.', userStatus: 'complete' });
                }
            );
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// =============================================================
// ROUTE 3: Complete Signup (Aadhaar/Name/Location) - Only for new users
// POST /api/auth/complete-profile
// =============================================================
// This route will need a JWT Middleware to protect it, using the short-lived token from verify-otp.
// For simplicity here, we'll assume the client passes the User ID or we create a simple version.
// *Note: A proper implementation requires the `auth` middleware.*

// We'll define a basic version here, assuming the token passed from the previous step is validated later.
router.post('/complete-profile', async (req, res) => {
    // In a real app, the user ID would come from the validated JWT token (req.user.id)
    const { userId, name, aadhaarNumber, documentUrl, city, state, district } = req.body;

    try {
        let user = await User.findById(userId); // Use ID from validated token later

        if (!user) {
            return res.status(404).json({ msg: 'User not found or session expired' });
        }

        // Update the user's profile with remaining required data
        user.name = name;
        user.aadhaarData = {
            number: aadhaarNumber,
            documentUrl: documentUrl // URL to the uploaded file
        };
        user.currentLocation = { city, state, district };

        await user.save();

        // Issue a new, long-lived JWT token for the now fully-registered user
        const payload = { user: { id: user.id, status: 'active' } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, msg: 'Account created successfully. Welcome!', userStatus: 'complete' });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;