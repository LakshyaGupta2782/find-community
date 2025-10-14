const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const auth = require('../middleware/auth'); // We need this to protect the route

// Route to find community members
// It is protected by the 'auth' middleware, so only logged-in users can access it.
router.get('/find', auth, communityController.findCommunity);

module.exports = router;