const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const ee = require("@google/earthengine"); // Import Google Earth Engine

require("dotenv").config();

const app = express();
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "mysecretkey";

// Load Earth Engine private key
const privateKey = require("/Users/nishitjain/Desktop/codimg/landsat/boxwood-scope-436601-g3-602d42046b96.json");

// Authenticate Earth Engine using the service account
ee.data.authenticateViaPrivateKey(privateKey, () => {
  ee.initialize(null, null, () => {
    console.log("Google Earth Engine client initialized.");
  });
});

// Middlewares
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000", // Allow requests from your frontend
  })
);

// Modified User schema to handle optional password for Google OAuth user
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false, default: null }, // Password is optional
});

const User = mongoose.model("User", userSchema); // Ensure the model uses the updated schema

// Function to find or create a user
async function findOrCreateUser(email, name) {
  try {
    let user = await User.findOne({ email });
    if (!user) {
      // Create user without password for Google OAuth users
      user = new User({ name, email, password: null });
      await user.save();
    }
    return user;
  } catch (error) {
    console.error("Error in findOrCreateUser:", error);
    throw error;
  }
}

// Authentication routes
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post("/register-google", async (req, res) => {
  const { email, name } = req.body;

  try {
    // Use the findOrCreateUser function to either find or create the user
    const user = await findOrCreateUser(email, name);

    // Generate a JWT token for the user
    jwt.sign(
      { email: user.email, id: user._id },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;

        // Send the JWT token as a cookie and user data as a response
        res
          .cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // secure in production
            sameSite: "strict",
          })
          .json(user);
      }
    );
  } catch (error) {
    console.error("Error in /register-google:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign(
        { email: userDoc.email, id: userDoc._id },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res
            .cookie("token", token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
            })
            .json(userDoc);
        }
      );
    } else {
      res.status(422).json("Password is incorrect");
    }
  } else {
    res.json("User not found");
  }
});

app.post("/login-google", async (req, res) => {
  const { email, name } = req.body;
  try {
    const user = await findOrCreateUser(email, name);
    jwt.sign(
      { email: user.email, id: user._id },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res
          .cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          })
          .json(user);
      }
    );
  } catch (error) {
    console.error("Error in /login-google:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json("No token found");
  }
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) {
      return res.status(401).json("Invalid token");
    }
    const user = await User.findById(userData.id);
    if (!user) {
      return res.status(404).json("User not found");
    }
    const { name, email, _id } = user;
    res.json({ name, email, _id });
  });
});

// Earth Engine route to fetch NDVI data and tile URL
app.get("/earth-engine-data", (req, res) => {
  const { longitude, latitude } = req.query;

  if (!longitude || !latitude) {
    return res.status(400).json({ error: "Missing latitude or longitude" });
  }

  try {
    // Load Landsat 8 Surface Reflectance Image Collection
    const landsatSR = ee
      .ImageCollection("LANDSAT/LC08/C02/T1_L2")
      .filterDate("2022-01-01", "2023-08-31")
      .filterBounds(
        ee.Geometry.Point([parseFloat(longitude), parseFloat(latitude)])
      );

    // Get the first image from the collection
    landsatSR.size().evaluate((size) => {
      if (size > 0) {
        const image = landsatSR.first();
        const surfaceReflectance = image
          .select(["SR_B4", "SR_B5"])
          .multiply(0.0000275)
          .add(-0.2);

        const ndvi = surfaceReflectance
          .normalizedDifference(["SR_B5", "SR_B4"])
          .rename("NDVI");

        // Get the NDVI Map ID and token
        ndvi.getMap(
          { min: -1, max: 1, palette: ["brown", "yellow", "green"] },
          function (map) {
            const tileUrl = map.urlFormat; // Extract the tile URL

            // Calculate NDVI value at the point
            const ndviValue = ndvi.reduceRegion({
              reducer: ee.Reducer.mean(),
              geometry: ee.Geometry.Point([
                parseFloat(longitude),
                parseFloat(latitude),
              ]),
              scale: 30,
            });

            ndviValue.evaluate((result) => {
              res.json({
                ndvi: result.NDVI || "No NDVI data",
                tileUrl: tileUrl, // This contains the correct mapid and placeholders
              });
            });
          }
        );
      } else {
        res.json({
          error: "No images found for the specified date range and location.",
        });
      }
    });
  } catch (error) {
    console.error("Error retrieving Earth Engine data:", error);
    res.status(500).json({ error: "Failed to retrieve Earth Engine data" });
  }
});

// Logout
app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

// Start the server
app.listen(3001, () => {
  console.log("Server running on port 3001");
});
