const User = require('../models/User');

const resolveUserFromRequest = async (req) => {
    if (req.user) {
        return req.user;
    }

    const candidateIds = [
        req.headers['x-user-id'],
        req.headers['x-userid'],
        req.query?.userId,
        req.body?.userId
    ].filter(Boolean);

    if (candidateIds.length === 0) {
        return null;
    }

    for (const userId of candidateIds) {
        try {
            const user = await User.findById(userId);
            if (user) {
                req.user = user;
                return user;
            }
        } catch (error) {
        }
    }
    return null;
};

function isAuthenticated(requiredRole = null) {
    return async (req, res, next) => {
        try {
            if (req.session?.user) {
                if (requiredRole && req.session.user.role !== requiredRole) {
                    return res.status(403).send('Forbidden: insufficient role');
                }
                return next();
            }

            const user = await resolveUserFromRequest(req);

            if (!user) {
                return res.redirect('/login');
            }

            req.session.user = {
                _id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.role
            };

            if (requiredRole && user.role !== requiredRole) {
                return res.status(403).send('Forbidden: insufficient role');
            }

            next();
        } catch (error) {
            console.error('Auth error:', error);
            return res.status(500).send('Server error during authentication.');
        }
    };
}

module.exports.isAuthenticated = isAuthenticated;

exports.isAdmin = (req, res, next) => {
    try {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }

        if (req.session.user.role !== 'Admin') {
            return res.status(403).send('Access denied: Admins only');
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).send('Server Error');
    }
};