const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Response = require('../Domain/Response');
dotenv.config();
const JWT_SCRECT_KEY = process.env.JWT_SCRECT_KEY || "secrect_key";
const exipry = process.env.JWT_SCRECT_KEY || "2 days";
const generateToken = (userId) => {
    const payload = {
        id: userId
    };

    const options = {
        expiresIn: exipry
    }

    const token = jwt.sign(payload, JWT_SCRECT_KEY, options);
    return token;
};

const verifyUser = (req, res, next) => {
    // Check if the Authorization header exists
    const authHeader = req.headers["authorization"] ||req.headers["Authorization"] ;
    if (!authHeader) {
        return res.send(new Response(403, "Forbidden", "Auth required"));
    }

    // Split the header to get the token, ensure it's in the correct format
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.send(new Response(403, "Forbidden", "Token required"));
    }

    try {
        // Verify the token using JWT
        const decoded = jwt.verify(token, JWT_SCRECT_KEY);
        req.user = decoded;  // Attach decoded user info to the request object
        next(); // Call the next middleware/handler
    } catch (error) {
        console.error("Token verification failed:", error);  // Log the error for debugging
        return res.send(new Response(401, "Unauthorized", "You are not logged in"));
    }
};
module.exports = { generateToken, verifyUser };