const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // 1. Get the token from the 'Authorization' header (e.g., "Bearer <token>")
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication failed: No token provided.' });
    }

    // 2. Verify the token using the secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Add the user's ID to the request object so the next function can use it
    req.userId = decodedToken.userId;

    // 4. If the token is valid, proceed to the next function (the controller)
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed: Invalid token.' });
  }
};

module.exports = auth;