const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const sendVerificationEmail = require('../services/emailService');

const router = express.Router();

// Rate limiter for resend
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many resend requests, please try again later.'
});

// Signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      // Use JWT for verification token
      const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const verificationToken = jwt.sign(
        { email, exp: Math.floor(tokenExpiry.getTime() / 1000) },
        process.env.JWT_SECRET
      );

    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      tokenExpiry
    });
    await user.save();

    await sendVerificationEmail(email, verificationToken);
    res.status(201).json({ message: 'User created. Please check your email for verification.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;
  try {
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const verifiedUser = await User.findOne({ email: payload.email, verificationToken: token });
    if (!verifiedUser) return res.status(400).json({ message: 'Invalid token' });
    if (verifiedUser.tokenExpiry < new Date()) {
      return res.status(400).json({ message: 'Token expired. Please request a new verification email.' });
    }
    verifiedUser.isActive = true;
    verifiedUser.verificationToken = undefined;
    verifiedUser.tokenExpiry = undefined;
    await verifiedUser.save();

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend verification
router.post('/resend', resendLimiter, async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.isActive) return res.status(400).json({ message: 'User already verified' });

    const now = new Date();
    if (user.lastResend && (now - user.lastResend) < 60 * 60 * 1000) {
      user.resendCount += 1;
    } else {
      user.resendCount = 1;
    }
    user.lastResend = now;

    if (user.resendCount > 3) return res.status(429).json({ message: 'Too many resend requests' });

    // Generate new JWT token for resend
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    const verificationToken = jwt.sign(
      { email, exp: Math.floor(tokenExpiry.getTime() / 1000) },
      process.env.JWT_SECRET
    );
    user.verificationToken = verificationToken;
    user.tokenExpiry = tokenExpiry;
    await user.save();

    await sendVerificationEmail(email, verificationToken);
    res.json({ message: 'Verification email sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;