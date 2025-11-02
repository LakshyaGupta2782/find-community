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
//       return res.status(400).json({ message: 'No Aadhaar card image was uploaded.'});
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
// const fs = require('fs');
// const Jimp = require('jimp');
// const QrCode = require('qrcode-reader');
// const xml2js = require('xml2js'); // Import the new package

// // Controller for the /upload-aadhaar route
// exports.uploadAadhaar = async (req, res) => {
//   const userId = req.userId;
//   const file = req.file;

//   if (!file) {
//     return res.status(400).json({ message: 'No Aadhaar card image was uploaded.' });
//   }

//   const filePath = file.path;

//   try {
//     const buffer = fs.readFileSync(filePath);
//     const image = await Jimp.read(buffer);
//     const qrCodeInstance = new QrCode();

//     const qrCodeData = await new Promise((resolve, reject) => {
//       qrCodeInstance.callback = (err, value) => err ? reject(err) : resolve(value);
//       qrCodeInstance.decode(image.bitmap);
//     });

//     if (!qrCodeData || !qrCodeData.result) {
//       return res.status(400).json({ message: 'Could not detect a QR code in the image.' });
//     }

//     // 1. Parse the XML data from the QR code result
//     const parsedXml = await xml2js.parseStringPromise(qrCodeData.result, { explicitArray: false });

//     // The data is usually nested inside PrintLetterBarcodeData's attributes ($)
//     const aadhaarData = parsedXml.PrintLetterBarcodeData.$;

//     // 2. Extract the required fields
//     const name = aadhaarData.name;
//     const aadhaarNumber = aadhaarData.uid;
//     const address = [
//       aadhaarData.house,
//       aadhaarData.street,
//       aadhaarData.vtc, // Village/Town/City
//       aadhaarData.dist,
//       aadhaarData.state,
//       aadhaarData.pc, // Pincode
//     ].filter(Boolean).join(', '); // Join the parts that exist with a comma

//     // 3. Basic Validation: Check if the Aadhaar number is a 12-digit number
//     if (!/^\d{12}$/.test(aadhaarNumber)) {
//       return res.status(422).json({ message: 'Invalid Aadhaar data found in QR code.' });
//     }

//     // 4. Find the user in the database and update their profile
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     user.name = name;
//     user.address = address;
//     user.aadhaarNumber = aadhaarNumber;
//     await user.save();

//     // 5. Send a final success response
//     res.status(200).json({
//       message: 'Aadhaar details verified and saved successfully!',
//       user: {
//         name: user.name,
//         address: user.address,
//         aadhaarNumber: user.aadhaarNumber,
//       },
//     });

//   } catch (error) {
//     console.error('Aadhaar QR processing error:', error);
//     res.status(500).json({ message: 'Failed to process the Aadhaar image. The QR code may be invalid or unreadable.' });
//   } finally {
//     fs.unlinkSync(filePath); // Clean up the uploaded file
//   }
// };



// ...existing code...

const fs = require('fs');
const path = require('path'); // Import path module
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');
const xml2js = require('xml2js');
const crypto = require('crypto'); // Node.js crypto module for verification
const pako = require('pako'); // For decompressing QR data

// Load the UIDAI public key from the certificate file
const uidaiPublicKey = fs.readFileSync(path.join(__dirname, '../certs/uidai_public_key.pem'));

// ...existing code...

// Updated uploadAadhaar with robust parsing, fallback, and safe cleanup
exports.uploadAadhaar = async (req, res) => {
  const userId = req.userId;
  const file = req.file;

  if (!userId) return res.status(401).json({ message: 'Unauthorized.' });
  if (!file) return res.status(400).json({ message: 'No Aadhaar card image was uploaded.' });

  const filePath = file.path;
  const certPath = path.join(__dirname, '../certs/uidai_public_key.pem');
  let uidaiPublicKey = null;
  if (fs.existsSync(certPath)) {
    try { uidaiPublicKey = fs.readFileSync(certPath); } catch (e) { console.warn('Could not read UIDAI cert:', e.message); }
  }

  try {
    const buffer = fs.readFileSync(filePath);
    const image = await Jimp.read(buffer);
    const qrCodeInstance = new QrCode();

    const qrCodeValue = await new Promise((resolve, reject) => {
      qrCodeInstance.callback = (err, value) => (err ? reject(err) : resolve(value));
      qrCodeInstance.decode(image.bitmap);
    });

    if (!qrCodeValue || !qrCodeValue.result) {
      return res.status(400).json({ message: 'Could not detect a QR code in the image. Try a clearer image.' });
    }

    let parsed = null;
    const qrResult = qrCodeValue.result;

    // Try secure QR parsing if numeric and cert available
    if (/^[0-9]+$/.test(qrResult) && uidaiPublicKey) {
      try {
        let hex = BigInt(qrResult).toString(16);
        if (hex.length % 2) hex = '0' + hex; // pad if odd length
        const qrDataBytes = Buffer.from(hex, 'hex');

        if (qrDataBytes.length > 256) {
          const signature = qrDataBytes.slice(-256);
          const dataToVerify = qrDataBytes.slice(0, -256);

          const verifier = crypto.createVerify('sha256');
          verifier.update(dataToVerify);
          verifier.end();

          const isSignatureValid = verifier.verify(uidaiPublicKey, signature);
          if (!isSignatureValid) {
            return res.status(422).json({ message: 'Aadhaar verification failed: digital signature invalid.' });
          }

          // decompress and parse key:value pairs
          let decompressed;
          try {
            decompressed = pako.inflate(dataToVerify);
          } catch (e) {
            throw new Error('Decompression failed for secure QR payload.');
          }
          const dataString = Buffer.from(decompressed).toString('utf8');
          const fields = dataString.split(',').reduce((acc, part) => {
            const [k, ...v] = part.split(':');
            if (k && v.length) acc[k.trim()] = v.join(':').trim();
            return acc;
          }, {});

          parsed = {
            name: fields.n || '',
            address: [fields.h, fields.s, fields.vtc, fields.d, fields.st, fields.p].filter(Boolean).join(', '),
            aadhaarPartial: fields.l || ''
          };
        } else {
          throw new Error('Secure QR data too short to contain signature.');
        }
      } catch (err) {
        console.warn('Secure QR parse failed, falling back to XML if possible:', err.message);
        parsed = null; // ensure fallback
      }
    }

    // Fallback to XML format (older Aadhaar QR)
    if (!parsed) {
      try {
        const parsedXml = await xml2js.parseStringPromise(qrResult, { explicitArray: false });
        const aadhaarData = parsedXml?.PrintLetterBarcodeData?.$;
        if (!aadhaarData) throw new Error('XML format not recognized');
        parsed = {
          name: aadhaarData.name || '',
          address: [
            aadhaarData.house, aadhaarData.street, aadhaarData.vtc,
            aadhaarData.dist || aadhaarData.d, aadhaarData.state, aadhaarData.pc || aadhaarData.p
          ].filter(Boolean).join(', '),
          aadhaarFull: aadhaarData.uid || ''
        };
      } catch (err) {
        return res.status(400).json({ message: 'QR decoded but content not recognized as Aadhaar (secure or XML).' });
      }
    }

    // Update user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (parsed.name) user.name = parsed.name;
    if (parsed.address) user.address = parsed.address;
    if (parsed.aadhaarFull && /^\d{12}$/.test(parsed.aadhaarFull)) {
      user.aadhaarNumber = parsed.aadhaarFull;
    } else if (parsed.aadhaarPartial) {
      user.aadhaarNumber = `********${parsed.aadhaarPartial}`;
    }
    await user.save();

    return res.status(200).json({
      message: 'Aadhaar details verified and saved.',
      user: { name: user.name, address: user.address }
    });

  } catch (error) {
    console.error('Aadhaar verification error:', error);
    return res.status(500).json({ message: 'Server error processing Aadhaar. Check server logs.' });
  } finally {
    try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { /* ignore cleanup errors */ }
  }
};

// ...existing code...
// Controller for the /upload-aadhaar route
// exports.uploadAadhaar = async (req, res) => {
//   const userId = req.userId;
//   const file = req.file;

//   if (!file) {
//     return res.status(400).json({ message: 'No Aadhaar card image was uploaded.' });
//   }

//   const filePath = file.path;

//   try {
//     const buffer = fs.readFileSync(filePath);
//     const image = await Jimp.read(buffer);
//     const qrCodeInstance = new QrCode();

//     const qrCodeValue = await new Promise((resolve, reject) => {
//       qrCodeInstance.callback = (err, value) => err ? reject(err) : resolve(value);
//       qrCodeInstance.decode(image.bitmap);
//     });

//     if (!qrCodeValue || !qrCodeValue.result) {
//       return res.status(400).json({ message: 'Could not detect a QR code in the image.' });
//     }

//     // Secure QR codes store data as a large number (BigInt)
//     const qrDataBigInt = BigInt(qrCodeValue.result);
//     const qrDataBytes = Buffer.from(qrDataBigInt.toString(16), 'hex');

//     // The last 256 bytes are the signature
//     const signature = qrDataBytes.slice(-256);
//     // The data to be verified is everything before the signature
//     const dataToVerify = qrDataBytes.slice(0, -256);

//     // Create a verification object
//     const verifier = crypto.createVerify('sha256');
//     verifier.update(dataToVerify);
//     verifier.end();

//     // Verify the data against the signature using the public key
//     const isSignatureValid = verifier.verify(uidaiPublicKey, signature);

//     if (!isSignatureValid) {
//       return res.status(422).json({ message: 'Aadhaar verification failed: The digital signature is invalid.' });
//     }

//     // If signature is valid, decompress the data to get user details
//     const decompressedData = pako.inflate(dataToVerify);
//     const dataString = new TextDecoder().decode(decompressedData);

//     // The data is a delimited string. We need to parse it.
//     const aadhaarFields = dataString.split(',').reduce((acc, part) => {
//       const [key, ...value] = part.split(':');
//       if (key && value.length > 0) {
//         acc[key.trim()] = value.join(':').trim();
//       }
//       return acc;
//     }, {});

//     const name = aadhaarFields.n;
//     const aadhaarLast4Digits = aadhaarFields.l; // Secure QR only gives last 4 digits
//     const address = [
//       aadhaarFields.h, aadhaarFields.s, aadhaarFields.vtc,
//       aadhaarFields.d, aadhaarFields.st, aadhaarFields.p
//     ].filter(Boolean).join(', ');

//     // Find the user and save the verified data
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     user.name = name;
//     user.address = address;
//     // Note: Secure QR does not expose the full Aadhaar number for privacy.
//     user.aadhaarNumber = `********${aadhaarLast4Digits}`; // Store partial number
//     await user.save();

//     res.status(200).json({
//       message: 'Aadhaar details successfully verified and saved!',
//       user: { name: user.name, address: user.address },
//     });

//   } catch (error) 
//   {
//     console.error('Aadhaar verification error:', error);
//     res.status(500).json({ message: 'Failed to process Aadhaar. The QR code may not be a valid Secure QR code.' });
//   } finally {
//     fs.unlinkSync(filePath);
//   }
// };




// Controller for the /update-location route
exports.updateLocation = async (req, res) => {
  try {
    // The 'auth' middleware has already added the userId to the request object.
    const userId = req.userId;
    const { currentLocation } = req.body;

    // 1. Check if currentLocation was provided
    if (!currentLocation) {
      return res.status(400).json({ message: 'Current location is required.' });
    }

    // 2. Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 3. Update the user's location and save it
    user.currentLocation = currentLocation;
    await user.save();

    // 4. Send a success response
    res.status(200).json({
      message: 'Location updated successfully!',
      currentLocation: user.currentLocation,
    });

  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Server error during location update.' });
  }
};










