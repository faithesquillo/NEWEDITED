const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/profile-data/:id', async (req, res) => {
  console.log(`Fetching profile data for user ID: ${req.params.id}.`);
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      console.log('Profile data fetch failed: User not found.');
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log(`Profile data fetched for ${user.email}.`);
    res.json({ success: true, user });
  } catch (err) {
    console.error('Server error fetching profile data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/update/:id', async (req, res) => {
  console.log(`Updating user ID: ${req.params.id}.`);
  try {
    const { firstName, lastName, email, password, profileImage, role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, password, role, ...(profileImage && { profileImage }) },
      { new: true }
    ).lean();

    if (!updatedUser) {
      console.log('Update failed: User not found.');
      return res.json({ success: false, message: 'User not found' });
    }
    console.log(`User ${updatedUser.email} updated successfully.`);
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

router.post('/add', async (req, res) => {
  const { email } = req.body;
  console.log(`Admin attempting to add new user: ${email}.`);
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email) {
      console.log('Add user failed: Missing fields.');
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Add user failed: Email ${email} already exists.`);
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
    console.log(`New user ${newUser.email} added successfully (Role: ${newUser.role}).`);

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
  console.log(`Fetching user details for ID: ${req.params.id}.`);
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      console.log('Fetch failed: User not found.');
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log(`User details fetched for ${user.email}.`);
    res.json(user);
  } catch (err) {
    console.error('Server error fetching user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  console.log(`Updating user details for ID: ${req.params.id} via PUT.`);
  try {
    const { firstName, lastName, email, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, role },
      { new: true }
    ).lean();

    if (!updatedUser) {
      console.log('Update failed: User not found.');
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log(`User ${updatedUser.email} updated via PUT.`);

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

router.delete('/:id', async (req, res) => {
  console.log(`Deleting user ID: ${req.params.id}.`);
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      console.log('Deletion failed: User not found.');
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log(`User ${deleted.email} deleted successfully.`);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Deletion failed:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

module.exports = router;