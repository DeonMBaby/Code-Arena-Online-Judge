const crypto = require('crypto');
const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const { EmailDeliveryError, sendVerificationEmail } = require('../utils/mail');

function createVerificationPayload() {
  return {
    verificationToken: crypto.randomBytes(32).toString('hex'),
    verificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000)
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
    process.env.JWT_SECRET || 'secret123',
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    dob: user.dob,
    createdAt: user.createdAt
  };
}

function isDuplicateEmailError(err) {
  return err?.code === 11000 && err?.keyPattern?.email;
}

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, dob } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.exists({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashed,
      dob,
      ...createVerificationPayload()
    });
    await user.save();

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.'
    });

    sendVerificationEmail({
      to: user.email,
      token: user.verificationToken,
      fullName: user.fullName
    }).catch((err) => {
      console.error('Verification email dispatch failed after registration:', {
        message: err.message,
        email: user.email
      });
    });
  } catch (err) {
    if (isDuplicateEmailError(err)) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    if (!user.verificationExpiresAt || user.verificationExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification token expired. Request a new email.' });
    }

    user.isVerified = true;
    user.verifiedAt = new Date();
    user.verificationToken = undefined;
    user.verificationExpiresAt = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    Object.assign(user, createVerificationPayload());
    await user.save();

    await sendVerificationEmail({
      to: user.email,
      token: user.verificationToken,
      fullName: user.fullName
    });

    res.json({
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (err) {
    if (err instanceof EmailDeliveryError) {
      return res.status(500).json({ message: err.message });
    }
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.'
      });
    }

    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const [user, totals] = await Promise.all([
      User.findById(req.user.id).select('-password -verificationToken -verificationExpiresAt'),
      Submission.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            acceptedSubmissions: {
              $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] }
            },
            attemptedProblems: { $addToSet: '$problem' },
            acceptedProblems: {
              $addToSet: {
                $cond: [{ $eq: ['$verdict', 'Accepted'] }, '$problem', '$$REMOVE']
              }
            }
          }
        }
      ])
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stats = totals[0] || {
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      attemptedProblems: [],
      acceptedProblems: []
    };

    res.json({
      user,
      stats: {
        totalSubmissions: stats.totalSubmissions,
        acceptedSubmissions: stats.acceptedSubmissions,
        attemptedProblems: stats.attemptedProblems.length,
        solvedProblems: stats.acceptedProblems.length,
        accuracy: stats.totalSubmissions
          ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100)
          : 0
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;
