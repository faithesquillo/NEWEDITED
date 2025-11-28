const User = require('../models/User');

exports.createUser = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'Please fill in all fields' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const newUser = new User({ firstName, lastName, email, password, role: 'User' });
    await newUser.save();

    return res.status(200).json({ success: true, message: 'Account created successfully!', userId: newUser._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addUser = async (req, res) => {
  const { firstName, lastName, email, password, profileImage, role } = req.body;

  if (!firstName || !lastName || !email) {
    req.session.error = 'Missing required fields';
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.session.error = 'Email already exists';
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: password || '123456', 
      role: role || 'User',
      ...(profileImage && { profileImage })
    });

    await newUser.save();

    req.session.success = `User created successfully. Default password: ${password || '123456'}`;
  } catch (err) {
    console.error('Add user error:', err);
    req.session.error = 'Failed to add user';
  }
};


exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      req.session.error = `User not found with ID: ${req.params.id}`;
    }

    req.session.success = 'User updated successfully';
  } catch (error) {
    if (error.name === 'ValidationError' || error.code === 11000) {
      req.session.error = error.code === 11000
        ? 'Duplicate key error: User already exists.'
        : error.message;
    }

    req.session.error = `Server error during user update: ${error.message}`;
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      req.session.error = `User not found with ID: ${req.params.id}`;
    }

    req.session.success = 'User deleted successfully';
  } catch (error) {
    req.session.error = `Server error during user deletion: ${error.message}`;
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    req.session.success = `Fetched ${users.length} users successfully`;
    return res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    req.session.error = `Server error while fetching users: ${error.message}`;
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      req.session.error = `User not found with ID: ${req.params.id}`;
      return res.status(404).json({ success: false, message: req.session.error });
    }

    req.session.success = `User fetched successfully`;
    return res.json({ success: true, data: user });
  } catch (error) {
    req.session.error = error.kind === 'ObjectId'
      ? 'User not found (invalid ID format).'
      : `Server error while fetching user: ${error.message}`;
    return res.status(500).json({ success: false, message: req.session.error });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'Admin' });
    req.session.success = `Fetched ${admins.length} admins successfully`;
    return res.json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    req.session.error = `Server error while fetching admins: ${error.message}`;
    return res.status(500).json({ success: false, message: req.session.error });
  }
};

exports.getAllRegularUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'User' });
    req.session.success = `Fetched ${users.length} regular users successfully`;
    return res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    req.session.error = `Server error while fetching regular users: ${error.message}`;
    return res.status(500).json({ success: false, message: req.session.error });
  }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.session.user._id;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ success: false, message: 'All password fields are required.' });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            console.log(`[SYSTEM ERROR] User not found during password change for ID: ${userId}`);
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

      const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            console.log(`[AUTH FAIL] Invalid current password for user: ${user.email}`);
            return res.status(401).json({ success: false, message: 'Invalid current password.' });
        }
        
        user.password = newPassword;
        await user.save();

        console.log(`[AUTH SUCCESS] Password successfully changed for user: ${user.email}`);
        return res.json({ success: true, message: 'Password successfully changed.' });

    } catch (err) {
        console.log(`[SYSTEM ERROR] Password change error for user ID ${userId}:`, err);
        return res.status(500).json({ success: false, message: 'Server error during password update.' });
    }
};