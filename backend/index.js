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
    origin: "http://localhost:3000", // Adjust as per your frontend
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

// Convert lat/lng to path/row
const getPathRowFromLatLng = async (latitude, longitude) => {
  try {
    const url = `https://nimbus.cr.usgs.gov/arcgis/rest/services/LLook_Outlines/MapServer/1/query?where=MODE=%27D%27&geometry=${latitude},${longitude}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&returnTrueCurves=false&returnIdsOnly=false&returnCountOnly=false&returnZ=false&returnM=false&returnDistinctValues=false&f=json`;

    const response = await axios.get(url);

    if (
      response.data &&
      response.data.features &&
      response.data.features.length > 0
    ) {
      const { PATH, ROW } = response.data.features[0].attributes;
      console.log(`Converted Path: ${PATH}, Row: ${ROW}`);
      return { path: PATH, row: ROW };
    } else {
      throw new Error("Failed to retrieve Path/Row for the given lat/lng.");
    }
  } catch (error) {
    console.error("Error fetching path/row from USGS API:", error);
    return null;
  }
};

// Overpass Prediction
const fetchOverpassPrediction = async (year, month, day, path, row) => {
  try {
    const correctedMonth = month.substring(0, 3);
    const url = `https://landsat.usgs.gov/landsat/all_in_one_pending_acquisition/L9/Pend_Acq/y${year}/${correctedMonth}/${correctedMonth}-${day}-${year}.txt`;

    const response = await axios.get(url);

    if (response.status === 200) {
      const content = response.data.split("\n");
      const separator = "----------------------";
      const separatorIndices = content
        .map((line, index) => (line.includes(separator) ? index : -1))
        .filter((index) => index !== -1);

      if (separatorIndices.length >= 2) {
        const dataLines = content.slice(separatorIndices[1] + 1);
        const filteredData = dataLines
          .map((line) => line.trim().split(/\s+/))
          .filter((lineData) => lineData[0] === path && lineData[1] === row);

        if (filteredData.length > 0) {
          const julianDate = filteredData[0][2];
          const gregorianDate = julianToGregorian(julianDate);

          return {
            status: "success",
            message: `Overpass found for Path: ${path}, Row: ${row}, Julian Date: ${julianDate}`,
            gregorianDate,
          };
        } else {
          return {
            status: "error",
            message: "No overpass found for the given Path/Row.",
          };
        }
      } else {
        return { status: "error", message: "No valid data found in response." };
      }
    } else {
      return {
        status: "error",
        message: `Failed to retrieve data. Status: ${response.status}`,
      };
    }
  } catch (error) {
    console.error("Error fetching overpass prediction:", error);
    return { status: "error", message: "Error fetching overpass prediction." };
  }
};

// Julian to Gregorian conversion function
function julianToGregorian(julianDate) {
  const [julianDay, time] = julianDate.split("-");
  const dayOfYear = parseInt(julianDay, 10);
  if (isNaN(dayOfYear)) {
    throw new Error("Invalid Julian day format");
  }

  const year = new Date().getFullYear();
  const gregorianDate = new Date(year, 0);
  // Start at the beginning of the year (January 1st)
  gregorianDate.setDate(dayOfYear); // Set the day of the year

  let isoString = gregorianDate.toISOString().split("T")[0]; // Get YYYY-MM-DD format
  if (time) {
    isoString += ` ${time}`; // Append the time if available
  }

  return isoString;
}

// Endpoint to convert lat/lng to path/row
app.post("/convert-latlng-to-pathrow", async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Missing latitude or longitude" });
  }

  const result = await getPathRowFromLatLng(latitude, longitude);
  if (result) {
    res.json(result);
  } else {
    res
      .status(500)
      .json({ error: "Failed to convert coordinates to Path/Row." });
  }
});

// Overpass Prediction API endpoint
app.post("/predict-overpass", async (req, res) => {
  const { latitude, longitude, year, month, day } = req.body;

  if (!latitude || !longitude || !year || !month || !day) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // Convert lat/lng to path/row
  const pathRow = await getPathRowFromLatLng(latitude, longitude);

  if (pathRow) {
    const { path, row } = pathRow;
    const predictionResult = await fetchOverpassPrediction(
      year,
      month,
      day,
      path,
      row
    );
    res.json(predictionResult);
  } else {
    res
      .status(500)
      .json({ error: "Failed to retrieve Path/Row for the location." });
  }
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

    const landsatSR = ee
      .ImageCollection("LANDSAT/LC08/C02/T1_L2")
      .filterDate("2024-09-01", "2024-09-25")
      .filterBounds(targetPoint)
      .sort("system:time_start", false); // Sort by latest image first

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

        const pixelSize = 30;
        const halfWindowSize = pixelSize * 1.5;
        const gridRegion = targetPoint.buffer(halfWindowSize).bounds();

        const ndviGrid = ndvi.clip(gridRegion);

        const ndviPalette = [
          "#FF0000",
          "#FFA500",
          "#FFFF00",
          "#ADFF2F",
          "#008000",
        ];

        const pixelValues = ndviGrid.sample({
          region: gridRegion,
          scale: pixelSize,
          geometries: true,
        });

        pixelValues.evaluate((result) => {
          if (result && result.features.length > 0) {
            ndvi.getMap({ min: 0, max: 1, palette: ndviPalette }, (map) => {
              const tileUrl = map.urlFormat;

              res.json({
                ndviPixels: result.features.map((feature) => ({
                  lat: feature.geometry.coordinates[1],
                  lng: feature.geometry.coordinates[0],
                  ndvi: feature.properties.NDVI,
                })),
                tileUrl: tileUrl,
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

// Logout route
app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

// Start the server
app.listen(3001, () => {
  console.log("Server running on port 3001");
});
