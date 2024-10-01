const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const ee = require("@google/earthengine");
const axios = require("axios");
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

// Modified User schema to handle optional password for Google OAuth users
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
    const targetPoint = ee.Geometry.Point([
      parseFloat(longitude),
      parseFloat(latitude),
    ]);

    // Load the Landsat 8 Surface Reflectance Image Collection
    const landsatSR = ee
      .ImageCollection("LANDSAT/LC08/C02/T1_L2")
      .filterDate("2024-09-01", "2024-09-25")
      .filterBounds(targetPoint)
      .sort("system:time_start", false); // Sort by latest image first

    landsatSR.size().evaluate((size) => {
      if (size > 0) {
        const image = landsatSR.first();

        // Convert DN values to Surface Reflectance
        const surfaceReflectance = image
          .select(["SR_B4", "SR_B5"]) // Red (B4) and NIR (B5) bands
          .multiply(0.0000275)
          .add(-0.2);

        const ndvi = surfaceReflectance
          .normalizedDifference(["SR_B5", "SR_B4"])
          .rename("NDVI");

        // Define a 90m x 90m region (3x3 pixels) around the point of interest
        const pixelSize = 30; // Landsat pixel size is approx. 30 meters
        const halfWindowSize = pixelSize * 1.5; // 90m (3x3 grid)
        const gridRegion = targetPoint.buffer(halfWindowSize).bounds();

        // Clip NDVI to the grid region
        const ndviGrid = ndvi.clip(gridRegion);

        // Define the color palette for the NDVI display
        const ndviPalette = [
          "#FF0000",
          "#FFA500",
          "#FFFF00",
          "#ADFF2F",
          "#008000",
        ]; // Red to green

        // Extract pixel values within the grid
        const pixelValues = ndviGrid.sample({
          region: gridRegion,
          scale: pixelSize, // Use the Landsat pixel size
          geometries: true,
        });

        // Evaluate and return the pixel NDVI values
        pixelValues.evaluate((result) => {
          if (result && result.features.length > 0) {
            // Generate NDVI tile URL for display
            ndvi.getMap({ min: 0, max: 1, palette: ndviPalette }, (map) => {
              const tileUrl = map.urlFormat;

              res.json({
                ndviPixels: result.features.map((feature) => ({
                  lat: feature.geometry.coordinates[1],
                  lng: feature.geometry.coordinates[0],
                  ndvi: feature.properties.NDVI,
                })),
                tileUrl: tileUrl, // NDVI tile URL
              });
            });
          } else {
            res.json({ error: "No NDVI pixel values found in the grid." });
          }
        });
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

// Overpass Prediction
const fetchOverpassPrediction = async (year, month, day, path, row) => {
  try {
    const correctedMonth = month.substring(0, 3); // Correcting the month to 3 letters
    const url = `https://landsat.usgs.gov/landsat/all_in_one_pending_acquisition/L9/Pend_Acq/y${year}/${correctedMonth}/${correctedMonth}-${day}-${year}.txt`;

    console.log("Constructed Landsat acquisition URL:", url);
    const response = await axios.get(url);

    if (response.status === 200) {
      console.log("Successfully retrieved data from Landsat URL");

      const content = response.data.split("\n");
      console.log("Content retrieved:", content.slice(0, 10)); // Log first 10 lines for brevity

      const separator = "----------------------";
      const separatorIndices = content
        .map((line, index) => (line.includes(separator) ? index : -1))
        .filter((index) => index !== -1);

      if (separatorIndices.length >= 2) {
        const dataLines = content.slice(separatorIndices[1] + 1);
        console.log(
          "Data lines after second separator:",
          dataLines.slice(0, 10)
        ); // Log first 10 data lines for brevity

        // Parse the data and compare path and row
        const filteredData = dataLines
          .map((line) => line.trim().split(/\s+/))
          .filter((lineData) => lineData[0] === path && lineData[1] === row);

        console.log("Filtered Data for Path and Row:", filteredData);

        if (filteredData.length > 0) {
          // Assuming we have the Julian date in the third column
          const julianDate = filteredData[0][2]; // E.g., "272-01:24:05"
          console.log("Matching Julian Date found:", julianDate);

          // Convert Julian date to Gregorian
          const gregorianDate = julianToGregorian(julianDate);
          console.log("Converted Gregorian Date:", gregorianDate);

          return {
            status: "success",
            message: `Overpass found for Path: ${path}, Row: ${row}, Julian Date: ${julianDate}`,
            gregorianDate, // Include the converted Gregorian date in the response
          };
        } else {
          return {
            status: "error",
            message: `No overpass found for Path: ${path}, Row: ${row}`,
          };
        }
      } else {
        return {
          status: "error",
          message: "Data format error: Missing separator lines",
        };
      }
    } else {
      return {
        status: "error",
        message: `Failed to retrieve data. Status code: ${response.status}`,
      };
    }
  } catch (error) {
    console.error("Error fetching overpass prediction:", error);
    return {
      status: "error",
      message: "Error fetching overpass prediction",
    };
  }
};

// Julian to Gregorian conversion function
// Function to convert Julian Date to Gregorian Date
function julianToGregorian(julianDate) {
  // Split the Julian date into day and time components
  const [julianDay, time] = julianDate.split("-");

  // Check if the day part is a valid number
  const dayOfYear = parseInt(julianDay, 10);

  if (isNaN(dayOfYear)) {
    throw new Error("Invalid Julian day format");
  }

  // Create a new Date object with the given year and day of the year
  const year = new Date().getFullYear(); // Assume the current year for simplicity
  const gregorianDate = new Date(year, 0); // Start at the beginning of the year (January 1st)
  gregorianDate.setDate(dayOfYear); // Set the day of the year

  // If there's a time component, append it to the date
  let isoString = gregorianDate.toISOString().split("T")[0]; // Get YYYY-MM-DD format
  if (time) {
    isoString += ` ${time}`; // Append the time
  }

  return isoString;
}

// Overpass Prediction API endpoint
app.get("/landsat-overpass", async (req, res) => {
  const { year, month, day, path, row } = req.query;

  if (!year || !month || !day || !path || !row) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const predictionResult = await fetchOverpassPrediction(
    year,
    month,
    day,
    path,
    row
  );
  res.json(predictionResult);
});

// Logout
app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

// Start the server
app.listen(3001, () => {
  console.log("Server running on port 3001");
});
