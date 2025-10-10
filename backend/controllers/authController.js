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


// // Controller for the /upload-aadhaar route
// exports.uploadAadhaar = async (req, res) => {
//   try {
//     // The 'auth' middleware has already added the userId to the request object.
//     const userId = req.userId;

//     // The 'multer' middleware has added the file info to the request object.
//     const file = req.file;

//     // 1. Check if a file was actually uploaded
//     if (!file) {
//       return res.status(400).json({ message: 'No Aadhaar card image was uploaded.' });
//     }

//     // For now, we will just confirm that we received the file.
//     // In the next steps, we will process this file to read the QR code.
//     console.log(`Received Aadhaar card for user: ${userId}`);
//     console.log('File details:', file);

//     // 2. Send a temporary success response
//     res.status(200).json({
//       message: 'Aadhaar card uploaded successfully. Processing will begin.',
//       filePath: file.path,
//     });

//   } catch (error) {
//     console.error('Aadhaar upload error:', error);
//     res.status(500).json({ message: 'Server error during Aadhaar upload.' });
//   }
// };




// const fs = require('fs'); // Node.js File System module
// const Jimp = require('jimp');
// const QrCode = require('qrcode-reader');

// // Controller for the /upload-aadhaar route
// exports.uploadAadhaar = async (req, res) => {
//   // The 'auth' middleware has already added the userId to the request object.
//   const userId = req.userId;
//   const file = req.file;

//   // 1. Check if a file was actually uploaded
//   if (!file) {
//     return res.status(400).json({ message: 'No Aadhaar card image was uploaded.' });
//   }

//   const filePath = file.path;

//   try {
//     // 2. Read the image buffer from the uploaded file path
//     const buffer = fs.readFileSync(filePath);
//     const image = await Jimp.read(buffer);

//     // 3. Initialize a QR code reader
//     const qrCodeInstance = new QrCode();

//     // 4. Set up a promise to handle the QR reader's callback
//     const qrCodeData = await new Promise((resolve, reject) => {
//       qrCodeInstance.callback = (err, value) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(value);
//       };
//       // 5. Decode the QR code from the image
//       qrCodeInstance.decode(image.bitmap);
//     });

//     if (!qrCodeData) {
//       return res.status(400).json({ message: 'Could not detect a QR code in the image. Please upload a clearer image.' });
//     }

//     // For now, we will just return the raw data from the QR code.
//     // In the next step, we will parse this data.
//     res.status(200).json({
//       message: 'QR code decoded successfully.',
//       qrData: qrCodeData.result,
//     });

//   } catch (error) {
//     console.error('Aadhaar QR processing error:', error);
//     res.status(500).json({ message: 'Failed to process the Aadhaar image.' });
//   } finally {
//     // 6. Always delete the temporary file from the 'uploads' folder
//     fs.unlinkSync(filePath);
//   }
// };

// ...existing code...
const fs = require('fs');
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');
const xml2js = require('xml2js'); // Import the new package

// Controller for the /upload-aadhaar route
exports.uploadAadhaar = async (req, res) => {
  const userId = req.userId;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No Aadhaar card image was uploaded.' });
  }

  const filePath = file.path;

  try {
    const buffer = fs.readFileSync(filePath);
    const image = await Jimp.read(buffer);
    const qrCodeInstance = new QrCode();

    const qrCodeData = await new Promise((resolve, reject) => {
      qrCodeInstance.callback = (err, value) => err ? reject(err) : resolve(value);
      qrCodeInstance.decode(image.bitmap);
    });

    if (!qrCodeData || !qrCodeData.result) {
      return res.status(400).json({ message: 'Could not detect a QR code in the image.' });
    }

    // 1. Parse the XML data from the QR code result
    const parsedXml = await xml2js.parseStringPromise(qrCodeData.result, { explicitArray: false });

    // The data is usually nested inside PrintLetterBarcodeData's attributes ($)
    const aadhaarData = parsedXml.PrintLetterBarcodeData.$;

    // 2. Extract the required fields
    const name = aadhaarData.name;
    const aadhaarNumber = aadhaarData.uid;
    const address = [
      aadhaarData.house,
      aadhaarData.street,
      aadhaarData.vtc, // Village/Town/City
      aadhaarData.dist,
      aadhaarData.state,
      aadhaarData.pc, // Pincode
    ].filter(Boolean).join(', '); // Join the parts that exist with a comma

    // 3. Basic Validation: Check if the Aadhaar number is a 12-digit number
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(422).json({ message: 'Invalid Aadhaar data found in QR code.' });
    }

    // 4. Find the user in the database and update their profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.name = name;
    user.address = address;
    user.aadhaarNumber = aadhaarNumber;
    await user.save();

    // 5. Send a final success response
    res.status(200).json({
      message: 'Aadhaar details verified and saved successfully!',
      user: {
        name: user.name,
        address: user.address,
        aadhaarNumber: user.aadhaarNumber,
      },
    });

  } catch (error) {
    console.error('Aadhaar QR processing error:', error);
    res.status(500).json({ message: 'Failed to process the Aadhaar image. The QR code may be invalid or unreadable.' });
  } finally {
    fs.unlinkSync(filePath); // Clean up the uploaded file
  }
};

















