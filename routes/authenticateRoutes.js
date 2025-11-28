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
    res.render('authentication/login', { 
        title: 'Login', 
        heading: 'Login',
        success: req.session.success,
        error: req.session.error
    });
    req.session.success = null;
    req.session.error = null;
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
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

        req.session.save(() => {
            return res.redirect('/searchPage');
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

router.get('/signup', (req, res) => {
    res.render('authentication/signup', { title: 'Sign Up', heading: 'Create an Account' });
});

// userRoutes.js
router.post('/signup', UserController.createUser);

router.put('/users/change-password', isAuthenticated(), UserController.changePassword);

router.get('/searchPage', async (req, res) => {
    try {
        const cities = await City.find({}).sort({ name: 1 });
        const exploreCountries = await Country.find({}).sort({ title: 1 });

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
    try {
        const cities = await City.find({}).sort({ name: 1 });
        const exploreCountries = await Country.find({}).sort({ title: 1 });

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
    try {
        const users = await User.find().lean(); 
        res.render('users/userManagement', { 
            users, 
            title: 'User Management',
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Server Error');
    }
});

router.get('/userProfile', isAuthenticated(), (req, res) => {
    const user = req.session.user;
    res.render('users/userProfile', {
        title: 'User Profile',
        user: {
            ...user,
            profileImage: user.profileImage || '/default-profile.png'
        }
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send({ success: false });
        res.redirect('/login');
    });
});

router.get('/', (req, res) => {
    res.redirect('/login');
});

module.exports = router;