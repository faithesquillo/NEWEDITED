const User = require('../models/User');

exports.createUser = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    console.log('User creation failed: Missing fields.');
    return res.status(400).json({ success: false, message: 'Please fill in all fields' });
  }

  if (password !== confirmPassword) {
    console.log('User creation failed: Passwords do not match.');
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User creation failed: Email already exists.');
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const newUser = new User({ firstName, lastName, email, password, role: 'User' });
    await newUser.save();

    console.log('New User created:', newUser.email);
    return res.status(200).json({ success: true, message: 'Account created successfully!', userId: newUser._id });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addUser = async (req, res) => {
  const { firstName, lastName, email, password, profileImage, role } = req.body;

  if (!firstName || !lastName || !email) {
    req.session.error = 'Missing required fields';
    console.log('Admin add user failed: Missing fields.');
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.session.error = 'Email already exists';
      console.log('Admin add user failed: Email already exists.');
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
    console.log('Admin added new User:', newUser.email, 'Role:', role || 'User');
  } catch (err) {
    console.error('Add user error:', err);
    req.session.error = 'Failed to add user';
    console.error('Failed to add user:', err);
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
      console.log('User update failed: ID not found.');
    } else {
        req.session.success = 'User updated successfully';
        console.log('User updated:', user.email);
    }

  } catch (error) {
    if (error.name === 'ValidationError' || error.code === 11000) {
      req.session.error = error.code === 11000
        ? 'Duplicate key error: User already exists.'
        : error.message;
    }

    req.session.error = `Server error during user update: ${error.message}`;
    console.error('Server error updating user ID:', req.params.id, error);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      req.session.error = `User not found with ID: ${req.params.id}`;
      console.log('User deletion failed: ID not found.');
    } else {
        req.session.success = 'User deleted successfully';
        console.log('User deleted:', user.email);
    }

  } catch (error) {
    req.session.error = `Server error during user deletion: ${error.message}`;
    console.error('Server error deleting user ID:', req.params.id, error);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    req.session.success = `Fetched ${users.length} users successfully`;
    console.log('Fetched', users.length, 'users for admin list.');
    return res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    req.session.error = `Server error while fetching users: ${error.message}`;
    console.error('Server error fetching all users:', error);
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
    console.error('Server error fetching user ID:', req.params.id, error);
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
            console.log('User not found during password change for ID:', userId);
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

      const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            console.log('Invalid current password for user ID:', userId);
            return res.status(401).json({ success: false, message: 'Invalid current password.' });
        }
        
        user.password = newPassword;
        await user.save();

        console.log('Password successfully changed for user ID:', userId);
        return res.json({ success: true, message: 'Password successfully changed.' });

    } catch (err) {
        console.error('Password change error for user ID:', userId, err);
        return res.status(500).json({ success: false, message: 'Server error during password update.' });
    }
};