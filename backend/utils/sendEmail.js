// utils/sendEmail.js
const nodemailer = require('nodemailer');

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use any service, or configure SMTP manually
    auth: {
        user: process.env.OTP_EMAIL, // Your email address from .env
        pass: process.env.OTP_PASS  // Your email password or app key from .env
    }
});

const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.OTP_EMAIL,
            to: email,
            subject: 'Community Connect Platform: Your Verification OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333;">OTP Verification</h2>
                    <p>Thank you for connecting with us! Please use the following One-Time Password (OTP) to verify your account:</p>
                    <h1 style="color: #007BFF; background-color: #f0f0f0; padding: 10px; border-radius: 5px; display: inline-block;">${otp}</h1>
                    <p>This OTP is valid for 5 minutes. Please do not share this code with anyone.</p>
                    <p>Regards,<br>Community Connect Team</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};

module.exports = { sendOTPEmail };