// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');

// =============================================================
// ROUTE 1: Get User Profile
// GET /api/users/profile
// Access: Private (Requires Auth)
// =============================================================
router.get('/profile', auth, async (req, res) => {
    try {
        // req.user.id is populated by the 'auth' middleware
        const user = await User.findById(req.user.id).select('-otp -otpExpires');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // Return only the necessary profile data
        res.json({
            name: user.name,
            email: user.email,
            aadhaarNumber: user.aadhaarData.number,
            currentLocation: user.currentLocation
        });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// =============================================================
// ROUTE 2: Update Current Location
// PUT /api/users/location
// Access: Private (Requires Auth)
// =============================================================
router.put('/location', auth, async (req, res) => {
    const { city, state, district } = req.body;

    // Simple validation
    if (!city || !state || !district) {
        return res.status(400).json({ msg: 'City, State, and District are required' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { currentLocation: { city, state, district } },
            { new: true, runValidators: true } // {new: true} returns the updated document
        ).select('currentLocation');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ 
            msg: 'Location updated successfully', 
            currentLocation: user.currentLocation 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// =============================================================
// ROUTE 3: Community Search (List Page)
// GET /api/users/community?state=X&district=Y&city=Z
// Access: Private (Requires Auth) - To ensure only logged-in members can view the list
// =============================================================
router.get('/community', auth, async (req, res) => {
    const { state, district, city } = req.query;
    
    // Build the query object based on provided filters
    const filter = {};
    if (state) filter['currentLocation.state'] = state;
    if (district) filter['currentLocation.district'] = district;
    if (city) filter['currentLocation.city'] = city;
    
    // Ensure at least one filter is applied for performance/relevance
    if (Object.keys(filter).length === 0) {
        return res.status(400).json({ msg: 'Please provide at least one location filter (State, District, or City).' });
    }

    try {
        // Find users matching the criteria, but exclude the currently logged-in user
        const people = await User.find({
            ...filter,
            _id: { $ne: req.user.id }, // Exclude current user
            name: { $exists: true }    // Ensure the user is fully registered
        }).select('name currentLocation email'); // Select only necessary fields

        // Format the output
        const communityList = people.map(person => ({
            id: person._id,
            name: person.name,
            location: person.currentLocation
        }));

        res.json(communityList);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;