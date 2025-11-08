
const User = require('../models/user');

// ✅ Controller: Find community members based on currentLocation
exports.findCommunity = async (req, res) => {
  try {
    const userId = req.userId;

    // 1️⃣ Get current user
    const currentUser = await User.findById(userId);
    if (!currentUser || !currentUser.state || !currentUser.district || !currentUser.currentLocation) {
      return res.status(400).json({
        message: "Please complete your profile with current location, state, and district.",
      });
    }

    const { currentLocation, state, district } = currentUser;

    // 2️⃣ Find all users with the same currentLocation (excluding current user)
    const locationMatches = await User.find({
      _id: { $ne: userId },
      currentLocation: { $regex: new RegExp(`^${currentLocation}$`, "i") }, // case-insensitive
    }).select("name state district currentLocation");

    // 3️⃣ From those, group into state and district matches
    const statePeople = locationMatches.filter(
      (u) => new RegExp(`^${state}$`, "i").test(u.state)
    );

    const districtPeople = locationMatches.filter(
      (u) => new RegExp(`^${district}$`, "i").test(u.district)
    );

    // 4️⃣ Return structured response
    return res.status(200).json({
      totalFound: statePeople.length + districtPeople.length,
      statePeople: statePeople.map((u) => ({
        id: u._id,
        name: u.name,
        state: u.state,
        district: u.district,
        currentLocation: u.currentLocation,
      })),
      districtPeople: districtPeople.map((u) => ({
        id: u._id,
        name: u.name,
        state: u.state,
        district: u.district,
        currentLocation: u.currentLocation,
      })),
    });
  } catch (error) {
    console.error("Find community error:", error);
    res.status(500).json({ message: "Server error while finding community." });
  }
};


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