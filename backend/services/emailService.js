const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  // Use HTTPS and JWT token in link - change to deployed URL in production
  const verificationUrl = `http://localhost:3000/verify/${token}`; // For development, use http
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email',
    html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email. This link will expire in 15 minutes.</p>`
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationEmail;