import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { imageUrl } from '../middleware/upload.js';

const publicFields = 'fullName username email avatar coverImage bio location website isPrivate followers following createdAt';
const issueToken = (id, expiresIn = '1d') => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });

export async function register(req, res, next) {
  try {
    const { fullName, username, email, password, confirmPassword } = req.body;
    if (!fullName?.trim() || !username?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Please complete all required fields.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
    if (confirmPassword !== undefined && password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,24}$/.test(cleanUsername)) return res.status(400).json({ message: 'Username must be 3–24 characters using letters, numbers, dots or underscores.' });
    const existing = await User.findOne({ $or: [{ email: email.trim().toLowerCase() }, { username: cleanUsername }] });
    if (existing) return res.status(409).json({ message: existing.email === email.trim().toLowerCase() ? 'An account with this email already exists.' : 'That username is already taken.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ fullName: fullName.trim(), username: cleanUsername, email: email.trim().toLowerCase(), passwordHash, avatar: imageUrl(req, req.file) });
    res.status(201).json({ token: issueToken(user._id, '7d'), user: await User.findById(user._id).select(publicFields) });
  } catch (error) { next(error); }
}

export async function login(req, res, next) {
  try {
    const { identifier, password, rememberMe } = req.body;
    if (!identifier?.trim() || !password) return res.status(400).json({ message: 'Enter your email or username and password.' });
    const value = identifier.trim().toLowerCase();
    const user = await User.findOne({ $or: [{ email: value }, { username: value }] }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'The email/username or password is incorrect.' });
    res.json({ token: issueToken(user._id, rememberMe ? '7d' : '1d'), user: await User.findById(user._id).select(publicFields) });
  } catch (error) { next(error); }
}

export async function me(req, res) {
  const user = await User.findById(req.user._id).select(publicFields);
  res.json({ user });
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Enter your current password and a new password.' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password must contain at least 8 characters.' });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: 'New passwords do not match.' });
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(400).json({ message: 'Your current password is incorrect.' });
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (error) { next(error); }
}
