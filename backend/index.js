const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const ee = require("@google/earthengine"); // Import Google Earth Engine
const axios = require("axios"); // Import Axios for overpass prediction

require("dotenv").config();

const app = express();
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "mysecretkey";

// Load Earth Engine private key
const privateKey = require("/Users/macncheese/Desktop/trial/landsat/boxwood-scope-436601-g3-602d42046b96.json");

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

const placeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  image: String, // Store the grid image URL or base64 string
  locationName: String,
  region: String,
  coordinates: {
    latitude: String,
    longitude: String,
  },
  dateSaved: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Place = mongoose.model("Place", placeSchema);

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
    // Load the latest available Landsat 8 Surface Reflectance Image Collection
    const landsatSR = ee
      .ImageCollection("LANDSAT/LC08/C02/T1_L2")
      .filterBounds(
        ee.Geometry.Point([parseFloat(longitude), parseFloat(latitude)])
      )
      .sort("system:time_start", false); // Sort by date, latest first

    // Get the first (most recent) image from the collection
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

        // Define a 90m x 90m region (3x3 pixels) around the point of interest
        const gridRegion = ee.Geometry.Point([
          parseFloat(longitude),
          parseFloat(latitude),
        ]).buffer(45);

        // Cloud detection using QA_PIXEL band
        const qaPixel = image.select("QA_PIXEL");

        // Bits for cloud confidence (bit 4) and cloud (bit 5)
        const cloudConfidence = qaPixel.bitwiseAnd(1 << 4).neq(0); // High confidence in cloud
        const cloudFlag = qaPixel.bitwiseAnd(1 << 5).neq(0); // Cloud presence bit

        // Combine both flags for the final cloud mask
        const cloudMask = cloudConfidence.or(cloudFlag);

        // Total pixels in the 3x3 grid
        const totalPixels = ee.Number(
          qaPixel
            .reduceRegion({
              reducer: ee.Reducer.count(),
              geometry: gridRegion,
              scale: 30,
              maxPixels: 1e9,
            })
            .get("QA_PIXEL")
        );

        // Cloud-covered pixels in the 3x3 grid
        const cloudPixels = ee.Number(
          cloudMask
            .reduceRegion({
              reducer: ee.Reducer.sum(),
              geometry: gridRegion,
              scale: 30,
              maxPixels: 1e9,
            })
            .get("QA_PIXEL")
        );

        // Cloud coverage percentage (ensure it stays between 0-100)
        const cloudCoveragePercentage = cloudPixels
          .divide(totalPixels)
          .multiply(100)
          .min(100)
          .max(0);

        // Calculate the mean NDVI value for the 90m x 90m grid
        const ndviValue = ndvi.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: gridRegion,
          scale: 30,
        });

        // Convert NDVI Map to a tile URL for visualization
        ndvi.getMap(
          { min: -1, max: 1, palette: ["brown", "yellow", "green"] },
          function (map) {
            const tileUrl = map.urlFormat; // Extract the NDVI tile URL for visualization

            // Evaluate the cloud coverage percentage and NDVI value
            cloudCoveragePercentage.evaluate((cloudCovPerc) => {
              ndviValue.evaluate((ndviVal) => {
                console.log("Cloud Coverage Percentage:", cloudCovPerc);
                console.log("NDVI Value:", ndviVal);

                res.json({
                  ndvi: ndviVal.NDVI || "No NDVI data", // NDVI value
                  cloudCoverage:
                    cloudCovPerc !== null && !isNaN(cloudCovPerc)
                      ? `${cloudCovPerc.toFixed(2)}%` // Return valid cloud coverage percentage
                      : "No cloud data", // Handle invalid cloud data
                  tileUrl: tileUrl, // URL to visualize NDVI as a tile
                });
              });
            });
          }
        );
      } else {
        res.json({
          error: "No images found for the specified location.",
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

app.post("/save", async (req, res) => {
  const { token } = req.cookies;
  const { image, locationName, region, coordinates } = req.body;

  try {
    // Verify the JWT token
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) {
        // If there's an error during verification, return a 403 status code
        return res.status(403).json({ message: "Invalid token" });
      }

      try {
        // Create the place document in the database
        const placeDoc = await Place.create({
          user: userData.id,
          image,
          locationName,
          region,
          coordinates,
        });

        // Respond with success and placeDoc
        return res.status(201).json({ message: "Location saved successfully!", placeDoc });
      } catch (dbError) {
        // If there's an error while saving to the database, return a 500 status code
        return res.status(500).json({ message: "Error saving location", error: dbError });
      }
    });
  } catch (error) {
    // Handle unexpected errors
    return res.status(500).json({ message: "Unexpected server error", error });
  }
});


// Start the server
app.listen(3001, () => {
  console.log("Server running on port 3001");
});
