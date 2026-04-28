const mongoose = require('mongoose');

// Use MONGO_URI from environment variables for production (Render/Atlas), 
// fallback to local database for development.
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/e-comm";

mongoose.connect(mongoURI)
  .then(() => console.log("Database connected successfully"))
  .catch(err => console.error("Database connection error:", err));
