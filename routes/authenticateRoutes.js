const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const router = express.Router();

const UserController = require('../controllers/userController');
const User = require('../models/User');
const City = require('../models/City');
const Country = require('../models/Country');

const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

router.get('/login', (req, res) => {
    console.log('Accessing login page.');
    res.render('authentication/login', { 
        title: 'Login', 
        heading: 'Login',
        success: req.session.success,
        error: req.session.error
    });
    console.log('Clearing ephemeral session messages.');
    req.session.success = null;
    req.session.error = null;
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log('Login failed: User not found.');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Login failed: Password mismatch for', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }


        req.session.user = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role
        };

        console.log('Login success for user:', user.email);

        req.session.save(() => {
            console.log('Session saved. Redirecting to /searchPage.');
            return res.redirect('/searchPage');
        });

    } catch (err) {
        console.error('POST /login server error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

router.get('/signup', (req, res) => {
    console.log('Accessing signup page.');
    res.render('authentication/signup', { title: 'Sign Up', heading: 'Create an Account' });
});

// userRoutes.js
router.post('/signup', (req, res, next) => {
    console.log('POST /signup request received.');
    UserController.createUser(req, res, next);
});

router.put('/users/change-password', isAuthenticated(), (req, res, next) => {
    console.log('Change password request by user:', req.session.user?.email);
    UserController.changePassword(req, res, next);
});

router.get('/searchPage', async (req, res) => {
    console.log('Accessing search page (User/Guest search).');
    try {
        const cities = await City.find({}).sort({ name: 1 });
        const exploreCountries = await Country.find({}).sort({ title: 1 });
        console.log('Fetched cities and countries.');


        res.render('flights/searchPage', {
            title: 'Search Page',
            cities: cities.map(c => ({ code: c.code, name: c.name })),
            exploreCountries,
        });
    } catch (err) {
        console.error('Error loading search page:', err);
        res.status(500).send('Error loading search page');
    }
});

router.get('/adminSearchPage', isAuthenticated('Admin'), isAdmin, async (req, res) => {
    console.log('Accessing admin search page (Admin only).');
    try {
        const cities = await City.find({}).sort({ name: 1 });
        const exploreCountries = await Country.find({}).sort({ title: 1 });
        console.log('Fetched cities for admin view.');

        res.render('flights/adminSearchPage', {
            title: 'Admin - Flight Management',
            cities: cities.map(c => ({ code: c.code, name: c.name })),
            exploreCountries,
        });
    } catch (err) {
        console.error('Error loading admin page:', err);
        res.status(500).send('Error loading admin page');
    }
});

router.get('/userManagement', isAuthenticated('Admin'), isAdmin, async (req, res) => {
    console.log('Accessing user management page (Admin only).');
    try {
        const users = await User.find().lean(); 
        console.log('Fetched users for management list:', users.length);
        res.render('users/userManagement', { 
            users, 
            title: 'User Management',
        });
    } catch (err) {
        console.error('Error fetching users for management:', err);
        res.status(500).send('Server Error');
    }
});

router.get('/userProfile', isAuthenticated(), (req, res) => {
    const user = req.session.user;
    console.log('Accessing user profile for:', user.email);
    res.render('users/userProfile', {
        title: 'User Profile',
        user: {
            ...user,
            profileImage: user.profileImage || '/default-profile.png'
        }
    });
});

router.get('/logout', (req, res) => {
    const userEmail = req.session.user?.email || 'UNKNOWN';
    console.log('Logout initiated for user:', userEmail);

    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session for', userEmail, ':', err);
            return res.status(500).send({ success: false });
        }
        console.log('Session destroyed. Redirecting to /login.');
        res.redirect('/login');
    });
});

router.get('/', (req, res) => {
    console.log('Accessing root. Redirecting to /login.');
    res.redirect('/login');
});

module.exports = router;