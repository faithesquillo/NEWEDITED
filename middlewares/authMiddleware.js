const User = require('../models/User');

const resolveUserFromRequest = async (req) => {
    console.log('Checking for user in request info...');
    if (req.user) {
        console.log('User already found:', req.user.email);
        return req.user;
    }

    const candidateIds = [
        req.headers['x-user-id'],
        req.headers['x-userid'],
        req.query?.userId,
        req.body?.userId
    ].filter(Boolean);

    if (candidateIds.length === 0) {
        console.log('No user ID found in request.');
        return null;
    }
    console.log('Found candidate user IDs:', candidateIds.join(', '));

    for (const userId of candidateIds) {
        try {
            const user = await User.findById(userId);
            if (user) {
                req.user = user;
                console.log('Resolved user:', user.email, 'from ID:', userId);
                return user;
            }
        } catch (error) {
            console.warn('Error finding user ID:', userId, error.message);
        }
    }
    console.log('Failed to find user from IDs.');
    return null;
};

function isAuthenticated(requiredRole = null) {
    return async (req, res, next) => {
        const requiredLog = requiredRole ? `(Role: ${requiredRole})` : '';
        console.log('Checking if user is logged in', requiredLog);

        try {
            if (req.session?.user) {
                const sessionUser = req.session.user;
                console.log('Active session found for user:', sessionUser.email);

                if (requiredRole && sessionUser.role !== requiredRole) {
                    console.log('Access denied. User lacks role.');
                    return res.status(403).send('Forbidden: insufficient role');
                }
                console.log('User authorized. Continuing.');
                return next();
            }

            console.log('No active session. Trying to resolve user passively.');
            const user = await resolveUserFromRequest(req);

            if (!user) {
                console.log('User not resolved. Redirecting to login.');
                return res.redirect('/login');
            }

            req.session.user = {
                _id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.role
            };
            console.log('Created new session context for resolved user:', user.email);


            if (requiredRole && user.role !== requiredRole) {
                console.log('Access denied. Resolved user lacks role.');
                return res.status(403).send('Forbidden: insufficient role');
            }

            console.log('Authentication successful. Continuing.');
            next();
        } catch (error) {
            console.error('Login check error:', error);
            return res.status(500).send('Server error during authentication.');
        }
    };
}

module.exports.isAuthenticated = isAuthenticated;

exports.isAdmin = (req, res, next) => {
    console.log('Checking for Admin role.');
    try {
        if (!req.session || !req.session.user) {
            console.log('Admin check failed: No session user. Redirecting to login.');
            return res.redirect('/login');
        }

        if (req.session.user.role !== 'Admin') {
            console.log('Admin check failed: User is not Admin.');
            return res.status(403).send('Access denied: Admins only');
        }

        console.log('Admin check passed for user:', req.session.user.email);
        next();
    } catch (error) {
        console.error('Error during Admin check:', error);
        return res.status(500).send('Server Error');
    }
};