const crypto = require('crypto');
const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const {
  EmailDeliveryError,
  sendVerificationEmail,
  sendPasswordResetEmail
} = require('../utils/mail');

// ---------- helpers ----------

function createVerificationPayload() {
  return {
    verificationToken: crypto.randomBytes(32).toString('hex'),
    verificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 min
  };
}

function createPasswordResetPayload() {
  return {
    resetPasswordToken: crypto.randomBytes(32).toString('hex'),
    resetPasswordExpiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, fullName: user.fullName, role: user.role },
    process.env.JWT_SECRET,
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

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

// ---------- REGISTER ----------

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, dob } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = normalizeEmail(email);
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
      isVerified: false,
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
    console.error('Register error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

// ---------- VERIFY EMAIL ----------

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

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

// ---------- RESEND VERIFICATION ----------

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
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

    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    if (err instanceof EmailDeliveryError) {
      return res.status(500).json({ message: err.message });
    }
    console.error('Resend verification error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

// ---------- LOGIN ----------

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

// ---------- FORGOT PASSWORD ----------

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });

    if (user) {
      Object.assign(user, createPasswordResetPayload());
      await user.save();

      sendPasswordResetEmail({
        to: user.email,
        token: user.resetPasswordToken,
        fullName: user.fullName
      }).catch((err) => {
        console.error('Password reset email dispatch failed:', {
          message: err.message,
          email: user.email
        });
      });
    }

    res.json({
      message: 'If an account exists for that email, a password reset link has been sent.'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

// ---------- RESET PASSWORD ----------

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ resetPasswordToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    if (!user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Reset token expired. Request a new one.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

// ---------- PROFILE ----------

router.get('/profile', auth, async (req, res) => {
  try {
    const [user, totals] = await Promise.all([
      User.findById(req.user.id).select(
        '-password -verificationToken -verificationExpiresAt -resetPasswordToken -resetPasswordExpiresAt'
      ),
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
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;