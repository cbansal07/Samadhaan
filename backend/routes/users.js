const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// A helper function for consistent error responses
const sendError = (res, err, context = 'Operation') => {
  console.error(`${context} error:`, err.message);
  res.status(500).json({ msg: `Server Error: ${context}`, error: err.message });
};

// @route   POST api/users/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ msg: 'Internal Server Error: JWT_SECRET is not defined.' });
  }

  const { firstName, lastName, email, password, mobile, role, departmentId } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ msg: 'Please provide all required fields.' });
  }

  try {
    let user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (user) {
      return res.status(400).json({ msg: 'User with this email already exists.' });
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      mobile,
      role,
      departmentId
    });

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);
    
    await newUser.save();

    const payload = { id: newUser.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 });

    res.json({
      token,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        departmentId: newUser.departmentId
      }
    });

  } catch (err) {
    sendError(res, err, 'User Registration');
  }
});

// @route   POST api/users/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ msg: 'Internal Server Error: JWT_SECRET is not defined.' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter both email and password.' });
  }

  try {
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials or user does not exist.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 });

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId
      }
    });

  } catch (err) {
    sendError(res, err, 'User Login');
  }
});

module.exports = router;
