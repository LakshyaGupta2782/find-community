const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp) => {
  try {
    // Create a transporter object using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address from .env file
        pass: process.env.EMAIL_PASS, // Your Gmail App Password from .env file
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Verification Code for Community Connect',
      text: `Your OTP code is: ${otp}. It is valid for 5 minutes.`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
};

module.exports = sendOTPEmail;