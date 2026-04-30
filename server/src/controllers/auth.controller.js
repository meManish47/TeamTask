const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user.id || user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  const safeUser = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  const token = signToken(safeUser);
  res.cookie('token', token, cookieOpts).status(201).json({ user: safeUser, token });
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const safeUser = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  const token = signToken(safeUser);
  res.cookie('token', token, cookieOpts).json({ user: safeUser, token });
};

exports.logout = (_req, res) => res.clearCookie('token').json({ message: 'Logged out' });

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
};
