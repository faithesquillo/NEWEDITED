const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/profile-data/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, password, profileImage, role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, password, role, ...(profileImage && { profileImage }) },
      { new: true }
    ).lean();

    if (!updatedUser)
      return res.json({ success: false, message: 'User not found' });
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: password || '123456',
      role: role || 'User'
    });

    await newUser.save();

    res.json({
      success: true,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Add user error:', err);
    res.status(500).json({ success: false, message: 'Failed to add user' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, role },
      { new: true }
    ).lean();

    if (!updatedUser)
      return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

module.exports = router;
