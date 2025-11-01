// const User = require('../models/user');

// // Controller to find community members
// exports.findCommunity = async (req, res) => {
//   try {
//     // The 'auth' middleware has already added the userId to the request object.
//     const userId = req.userId;

//     // 1. Find the currently logged-in user to get their details
//     const currentUser = await User.findById(userId);
//     if (!currentUser) {
//       return res.status(404).json({ message: 'Current user not found.' });
//     }

//     // For now, we will just confirm we can get the current user's data.
//     // In the next step, we will use this data to find other community members.
//     res.status(200).json({
//       message: 'Find community route is working.',
//       currentUser: {
//         email: currentUser.email,
//         address: currentUser.address,
//         currentLocation: currentUser.currentLocation,
//       },
//     });

//   } catch (error) {
//     console.error('Find community error:', error);
//     res.status(500).json({ message: 'Server error while finding community.' });
//   }
// };

const User = require('../models/user');

// Controller to find community members


exports.findCommunity = async (req, res) => {
  try {
    const userId = req.userId;
    const { filter } = req.query; // optional: state | district | city

    // 1. Get current user
    const currentUser = await User.findById(userId);
    if (!currentUser || !currentUser.address || !currentUser.currentLocation) {
      return res.status(400).json({ message: 'Complete profile: Aadhaar address and currentLocation required.' });
    }

    // 2. Parse native address parts (best-effort)
    const parts = currentUser.address.split(',').map(p => p.trim()).filter(Boolean);
    // assume format ends with: ..., city, district, state, pincode  (len >= 3)
    const len = parts.length;
    const nativeState = len >= 2 ? parts[len - 2] : parts[len - 1] || '';
    const nativeDistrict = len >= 3 ? parts[len - 3] : '';
    const nativeCity = len >= 4 ? parts[len - 4] : '';

    // 3. Find users in same currentLocation and same native state (case-insensitive)
    
    const stateRegex = new RegExp(nativeState.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape regex chars
    const stateMatches = await User.find({
      _id: { $ne: userId },
      currentLocation: currentUser.currentLocation,
      address: { $regex: stateRegex }
    }).select('name address currentLocation');

    // 4. Narrow to district and city in-memory (safer for partial matches)
    const districtMatches = nativeDistrict
      ? stateMatches.filter(u => new RegExp(nativeDistrict, 'i').test(u.address))
      : stateMatches;
    const cityMatches = nativeCity
      ? districtMatches.filter(u => new RegExp(nativeCity, 'i').test(u.address))
      : districtMatches;

    // 5. Choose members list according to filter param
    let membersList;
    if (filter === 'state') membersList = stateMatches;
    else if (filter === 'district') membersList = districtMatches;
    else membersList = cityMatches; // default city

    // 6. Respond with counts and concise member info
    res.status(200).json({
      counts: {
        state: stateMatches.length,
        district: districtMatches.length,
        city: cityMatches.length
      },
      members: membersList.map(u => ({
        id: u._id,
        name: u.name || 'Unnamed',
        address: u.address,
        currentLocation: u.currentLocation
      }))
    });

  } catch (error) {
    console.error('Find community error:', error);
    res.status(500).json({ message: 'Server error while finding community.' });
  }
};
