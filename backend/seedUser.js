const mongoose = require("mongoose");
const User = require("./models/user");

// ✅ Replace with your actual DB connection string
mongoose
  .connect("mongodb://localhost:27017/yourdbname", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");

    const dummyUsers = [
      { name: "Aarav Sharma", email: "aarav@example.com", state: "Rajasthan", district: "Jaipur", currentLocation: "Bangalore" },
      { name: "Priya Iyer", email: "priya@example.com", state: "Tamil Nadu", district: "Chennai", currentLocation: "Bangalore" },
      { name: "Neha Patel", email: "neha@example.com", state: "Gujarat", district: "Ahmedabad", currentLocation: "Bangalore" },
      { name: "Kavya Rao", email: "kavya@example.com", state: "Karnataka", district: "Bangalore Urban", currentLocation: "Bangalore" },
      { name: "Rohan Deshmukh", email: "rohan@example.com", state: "Maharashtra", district: "Mumbai City", currentLocation: "Bangalore" },
      { name: "Rahul Nair", email: "rahul@example.com", state: "Kerala", district: "Thiruvananthapuram", currentLocation: "Bangalore" },
      { name: "Ananya Singh", email: "ananya@example.com", state: "Uttar Pradesh", district: "Lucknow", currentLocation: "Bangalore" },
      { name: "Vikram Reddy", email: "vikram@example.com", state: "Telangana", district: "Hyderabad", currentLocation: "Bangalore" },
      { name: "Riya Kapoor", email: "riya@example.com", state: "Delhi", district: "New Delhi", currentLocation: "Delhi" },
      { name: "Manoj Joshi", email: "manoj@example.com", state: "Uttarakhand", district: "Dehradun", currentLocation: "Delhi" },
      { name: "Simran Kaur", email: "simran@example.com", state: "Punjab", district: "Amritsar", currentLocation: "Delhi" },
      { name: "Ravi Verma", email: "ravi@example.com", state: "Bihar", district: "Patna", currentLocation: "Delhi" },
      { name: "Meera Sinha", email: "meera@example.com", state: "Jharkhand", district: "Ranchi", currentLocation: "Delhi" },
      { name: "Devraj Boro", email: "devraj@example.com", state: "Assam", district: "Kamrup", currentLocation: "Delhi" },
      { name: "Anil Chhetri", email: "anil@example.com", state: "Sikkim", district: "East Sikkim", currentLocation: "Delhi" },
      { name: "Nandini Pradhan", email: "nandini@example.com", state: "Odisha", district: "Khurda", currentLocation: "Delhi" },
      { name: "Harshit Tiwari", email: "harshit@example.com", state: "Madhya Pradesh", district: "Bhopal", currentLocation: "Indore" },
      { name: "Rohit Kumar", email: "rohit@example.com", state: "Chhattisgarh", district: "Raipur", currentLocation: "Indore" },
      { name: "Suresh Babu", email: "suresh@example.com", state: "Andhra Pradesh", district: "Chittoor", currentLocation: "Chennai" },
      { name: "Harsh Raj", email: "harsh@example.com", state: "Jammu and Kashmir", district: "Srinagar", currentLocation: "Delhi" },
      { name: "Tanya Sharma", email: "tanya@example.com", state: "Haryana", district: "Gurugram", currentLocation: "Delhi" },
      { name: "Kiran Das", email: "kiran@example.com", state: "Tripura", district: "West Tripura", currentLocation: "Kolkata" },
      { name: "Sangita Rai", email: "sangita@example.com", state: "Meghalaya", district: "East Khasi Hills", currentLocation: "Kolkata" },
      { name: "Preeti Devi", email: "preeti@example.com", state: "Nagaland", district: "Kohima", currentLocation: "Kolkata" },
      { name: "Rakesh Das", email: "rakesh@example.com", state: "Andaman and Nicobar Islands", district: "South Andaman", currentLocation: "Chennai" },
      { name: "Vijaya Rani", email: "vijaya@example.com", state: "Puducherry", district: "Puducherry", currentLocation: "Chennai" },
      { name: "Aditi Menon", email: "aditi@example.com", state: "Goa", district: "North Goa", currentLocation: "Bangalore" },
      { name: "Deepak Rai", email: "deepak@example.com", state: "Mizoram", district: "Aizawl", currentLocation: "Kolkata" },
      { name: "Sneha Gurung", email: "sneha@example.com", state: "Arunachal Pradesh", district: "Papum Pare", currentLocation: "Kolkata" },
      { name: "Pema Lepcha", email: "pema@example.com", state: "Sikkim", district: "East Sikkim", currentLocation: "Kolkata" },
      { name: "Vivek Sharma", email: "vivek@example.com", state: "Manipur", district: "Imphal West", currentLocation: "Kolkata" },
      { name: "Ajay Kumar", email: "ajay@example.com", state: "Himachal Pradesh", district: "Shimla", currentLocation: "Delhi" },
      { name: "Ankit Chauhan", email: "ankit@example.com", state: "Himachal Pradesh", district: "Kullu", currentLocation: "Shimla" },
      { name: "Jyoti Rani", email: "jyoti@example.com", state: "Punjab", district: "Ludhiana", currentLocation: "Chandigarh" },
      { name: "Sonal Patel", email: "sonal@example.com", state: "Gujarat", district: "Surat", currentLocation: "Ahmedabad" },
      { name: "Mohan Yadav", email: "mohan@example.com", state: "Uttar Pradesh", district: "Varanasi", currentLocation: "Lucknow" },
      { name: "Kritika Joshi", email: "kritika@example.com", state: "Uttarakhand", district: "Nainital", currentLocation: "Dehradun" },
      { name: "Bhavesh Chauhan", email: "bhavesh@example.com", state: "Madhya Pradesh", district: "Udaipur", currentLocation: "Raipur" },
      { name: "Isha Thakur", email: "isha@example.com", state: "Madhya Pradesh", district: "Rajgarh", currentLocation: "Raipur" },
    ];

    await User.insertMany(dummyUsers);
    console.log(`${dummyUsers.length} dummy users added successfully!`);

    mongoose.connection.close();
  })
  .catch((err) => console.error("Error:", err));
