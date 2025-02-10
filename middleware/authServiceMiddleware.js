const axios = require('axios');

exports.authMiddleware = async (req, res, next) => {
    try {
        // Extract the session cookie from the incoming request
        const sessionCookie = req.headers.cookie;

        if (!sessionCookie) {
            return res
                .status(401)
                .json({
                    authenticated: false,
                    message: 'No session cookie found'
                });
        }

        // Make a request to the Auth service to verify the session
        const authResponse = await axios.get(
            `${process.env.AUTH_SERVICE_ENDPOINT}/check`,
            {
                headers: {
                    Cookie: sessionCookie // Forward the session cookie to the Auth service
                },
                withCredentials: true // Include credentials in the request
            }
        );

        // Handle the Auth service response
        if (authResponse.data.authenticated) {
            req.user = authResponse.data.user; // Attach the user data to the request object
            next(); // Continue to the next middleware or route handler
        } else {
            return res
                .status(401)
                .json({
                    authenticated: false,
                    message: 'User not authenticated'
                });
        }
    } catch (error) {
        console.error('Error during authentication:', error);
        return res
            .status(500)
            .json({ authenticated: false, message: 'Internal server error' });
    }
};
