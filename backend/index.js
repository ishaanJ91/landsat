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
const privateKey = require("/Users/macncheese/Desktop/trial/landsat/wise-diagram-437711-b1-e3a769fd19d9.json");

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
  ndviGrid: [
    {
      index: Number,
      ndvi: Number,
    },
  ], // Add ndviGrid to store NDVI data
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

const nodemailer = require("nodemailer");

// Configure the transporter with hardcoded email and password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hackathlonetcd@gmail.com", // Hardcoded email
    pass: "izxzfjdqynxzptlh", // Hardcoded password
  },
});

// Function to send the email with overpass data
const sendEmailNotification = async (email, subject, text) => {
  const mailOptions = {
    from: "hackathlonetcd@gmail.com", // Hardcoded sender email
    to: email, // Recipient's email
    subject: subject,
    text: text, // Email content
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

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

// Overpass Prediction

// Julian to Gregorian conversion function
// Function to convert Julian Date to Gregorian Date
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
  console.log(result);
  if (result) {
    res.json(result);
  } else {
    res
      .status(500)
      .json({ error: "Failed to convert coordinates to Path/Row." });
  }
});

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
  const { image, locationName, region, coordinates, ndviGrid } = req.body; // Get ndviGrid from request

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
          ndviGrid, // Store NDVI grid data
        });

        // Generate CSV content
        const locationHeaders = [
          "Latitude",
          "Longitude",
          "Country",
          "Region",
          "NDVI Image Link",
          "Download Date",
          "Download Time",
        ];
        const locationRows = [
          [
            coordinates.latitude,
            coordinates.longitude,
            region,
            locationName,
            image || "Unavailable",
            new Date().toLocaleDateString("en-GB"),
            new Date().toLocaleTimeString(),
          ],
        ];

        const ndviHeaders = ["Grid Index", "NDVI Value"];
        const ndviRows = ndviGrid.map((pixel, index) => [
          `Cell ${index + 1}`,
          pixel.ndvi.toFixed(2),
        ]);

        // Create CSV content
        const locationCsvContent = [
          locationHeaders.join(","),
          ...locationRows.map((row) => row.join(",")),
        ].join("\n");

        const ndviCsvContent = [
          ndviHeaders.join(","),
          ...ndviRows.map((row) => row.join(",")),
        ].join("\n");

        const fullCsvContent = `${locationCsvContent}\n\nNDVI Grid Values\n${ndviCsvContent}`;

        // Respond with success, placeDoc, and CSV content
        return res.status(201).json({
          message: "Location saved successfully!",
          placeDoc,
          csv: fullCsvContent, // Provide the CSV content for download
        });
      } catch (dbError) {
        // If there's an error while saving to the database, return a 500 status code
        return res
          .status(500)
          .json({ message: "Error saving location", error: dbError });
      }
    });
  } catch (error) {
    // Handle unexpected errors
    return res.status(500).json({ message: "Unexpected server error", error });
  }
});

app.get("/saved-locations", async (req, res) => {
  const { token } = req.cookies;

  try {
    // Verify JWT token
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }

      try {
        // Fetch saved locations for the user
        const savedLocations = await Place.find({ user: userData.id });
        return res.status(200).json(savedLocations);
      } catch (dbError) {
        return res
          .status(500)
          .json({ message: "Error fetching locations", error: dbError });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Unexpected server error", error });
  }
});

app.delete("/unsave", async (req, res) => {
  const { token } = req.cookies;
  const { lat, lng } = req.query; // Get lat and lng from query parameters

  try {
    // Verify JWT token
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }

      try {
        // Find and delete the place document for the authenticated user based on lat/lng
        const deletedLocation = await Place.findOneAndDelete({
          user: userData.id,
          "coordinates.latitude": lat,
          "coordinates.longitude": lng,
        });

        if (!deletedLocation) {
          return res.status(404).json({ message: "Location not found" });
        }

        // Respond with a success message and deleted location
        res
          .status(200)
          .json({ message: "Location successfully unsaved", deletedLocation });
      } catch (dbError) {
        console.error("Error unsaving location:", dbError);
        res
          .status(500)
          .json({ message: "Error unsaving location", error: dbError });
      }
    });
  } catch (error) {
    console.error("Unexpected server error:", error);
    res.status(500).json({ message: "Unexpected server error", error });
  }
});

const toggleSaveLocation = async (ev) => {
  ev.preventDefault();

  try {
    if (isLocationSaved) {
      // Unsave the location
      await axios.delete("/unsave", {
        params: { lat: inputLat, lng: inputLng },
      });
      setIsLocationSaved(false);
    } else {
      // Save the location
      const ndviGridWithColors = ndviGrid.map((pixel) => ({
        ndvi: pixel.ndvi.toFixed(2),
        rgb: getNDVIColor(pixel.ndvi),
      }));

      const locationData = {
        image: replacedUrl,
        locationName: addressComponents.state || "Unavailable",
        region: addressComponents.country || "Unavailable",
        coordinates: {
          latitude: inputLat,
          longitude: inputLng,
        },
        ndviGrid: ndviGridWithColors,
      };

      await axios.post("/save", locationData);
      setIsLocationSaved(true);
    }
  } catch (error) {
    console.error("Error toggling save state:", error);
  }
};

// NVDI

// Convert lat/lng to path/row
const getPathRowFromLatLng = async (latitude, longitude) => {
  try {
    console.log("Fetching Path/Row for:", latitude, longitude); // Log input
    const url = `https://nimbus.cr.usgs.gov/arcgis/rest/services/LLook_Outlines/MapServer/1/query?where=MODE=%27D%27&geometry=${longitude},${latitude}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&returnTrueCurves=false&returnIdsOnly=false&returnCountOnly=false&returnZ=false&returnM=false&returnDistinctValues=false&f=json`;
    console.log("USGS Query URL:", url); // Log constructed URL

    const response = await axios.get(url);
    console.log("Response data from USGS:", response.data); // Log full response

    if (
      response.data &&
      response.data.features &&
      response.data.features.length > 0
    ) {
      const pathRows = response.data.features.map((feature) => ({
        path: feature.attributes.PATH,
        row: feature.attributes.ROW,
      }));
      console.log("Found Path/Rows:", pathRows); // Log all path/row pairs
      return pathRows; // Return all possible path/row pairs
    } else {
      console.error("No Path/Row data found for the given lat/lng."); // Log failure
      throw new Error("Failed to retrieve Path/Row for the given lat/lng.");
    }
  } catch (error) {
    console.error("Error fetching Path/Row from USGS API:", error);
    return null;
  }
};

app.get("/earth-engine-seasonal-ndvi", async (req, res) => {
  const { longitude, latitude } = req.query;

  if (!longitude || !latitude) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const targetPoint = ee.Geometry.Point([
      parseFloat(longitude),
      parseFloat(latitude),
    ]);

    // Define date ranges for each season
    const seasons = [
      { name: "Spring", start: "2024-03-01", end: "2024-05-31" },
      { name: "Summer", start: "2024-06-01", end: "2024-08-31" },
      { name: "Fall", start: "2024-09-01", end: "2024-11-30" },
      { name: "Winter", start: "2023-12-01", end: "2024-02-28" },
    ];

    let seasonalResults = [];

    await Promise.all(
      seasons.map(async (season) => {
        const landsatSR = ee
          .ImageCollection("LANDSAT/LC08/C02/T1_L2")
          .filterDate(season.start, season.end)
          .filterBounds(targetPoint)
          .select(["SR_B4", "SR_B5"]); // Select the red and NIR bands

        // Calculate NDVI
        const ndvi = landsatSR
          .map((image) =>
            image.normalizedDifference(["SR_B5", "SR_B4"]).rename("NDVI")
          )
          .mean(); // Mean NDVI for the season

        // Get NDVI value
        const ndviValue = await ndvi
          .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: targetPoint,
            scale: 30,
            maxPixels: 1e9,
          })
          .get("NDVI")
          .getInfo();

        seasonalResults.push({
          season: season.name,
          ndvi: ndviValue,
        });

        console.log(`Season: ${season.name}, NDVI: ${ndviValue}`);
      })
    );

    res.json({ seasonalResults });
  } catch (error) {
    console.error("Error retrieving Earth Engine data:", error);
    res.status(500).json({ error: "Failed to retrieve NDVI data" });
  }
});

// Overpass Prediction
const fetchOverpassPrediction = async (year, month, day, path, row) => {
  try {
    const correctedMonth = month.substring(0, 3);
    const formattedDay = day.toString().padStart(2, "0");
    const url = `https://landsat.usgs.gov/landsat/all_in_one_pending_acquisition/L8/Pend_Acq/y${year}/${correctedMonth}/${correctedMonth}-${formattedDay}-${year}.txt`;

    const response = await axios.get(url);

    if (response.status === 200) {
      const content = response.data.split("\n"); // Log the first 10 lines of the data

      const separator = "----------------------";
      const separatorIndices = content
        .map((line, index) => (line.includes(separator) ? index : -1))
        .filter((index) => index !== -1);

      if (separatorIndices.length >= 2) {
        const dataLines = content.slice(separatorIndices[1] + 1); // Log first 10 lines after splitting

        // Split lines properly
        const filteredData = dataLines
          .map((line) => {
            const lineData = line.trim().split(/\s+/); // Log each parsed line
            return lineData;
          })
          .filter(
            (lineData) =>
              lineData[0] === String(path) && lineData[1] === String(row)
          );

        console.log("Filtered data:", filteredData);

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
            message: `No overpass found for Path: ${path}, Row: ${row} on the given date.`,
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

// Endpoint to convert lat/lng to path/row
app.post("/convert-latlng-to-pathrow", async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Missing latitude or longitude" });
  }

  const result = await getPathRowFromLatLng(latitude, longitude);
  console.log(result);
  if (result) {
    res.json(result);
  } else {
    res
      .status(500)
      .json({ error: "Failed to convert coordinates to Path/Row." });
  }
});

app.get("/ndvi-images", async (req, res) => {
  const { startDate, endDate, latitude, longitude, zoomLevel } = req.query;

  if (!startDate || !endDate || !latitude || !longitude) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    // Define the point location using latitude and longitude
    const point = ee.Geometry.Point([
      parseFloat(longitude),
      parseFloat(latitude),
    ]);

    // Define date range for filtering the image collection
    const start = ee.Date(startDate);
    const end = ee.Date(endDate);

    // Set the buffer size based on zoom level input (default 1000 meters)
    const bufferDistance = zoomLevel ? parseFloat(zoomLevel) * 1000 : 1000; // Default zoom is 1000 meters

    // Filter Landsat 8 surface reflectance image collection by date and bounds
    const imageCollection = ee
      .ImageCollection("LANDSAT/LC08/C02/T1_L2")
      .filterBounds(point)
      .filterDate(start, end)
      .map((image) => {
        // Calculate NDVI
        const ndvi = image
          .normalizedDifference(["SR_B5", "SR_B4"]) // Near Infrared (B5) and Red (B4)
          .rename("NDVI");
        return image.addBands(ndvi);
      });

    // Fetch the list of NDVI images and dates
    const imageList = imageCollection.toList(500); // Get up to 500 images
    const imageCount = imageList.size().getInfo();

    const ndviPalette = ["#FFA500", "#FFFF00", "#ADFF2F"];

    // Prepare results
    let results = [];
    for (let i = 0; i < imageCount; i++) {
      const image = ee.Image(imageList.get(i));
      const date = image.date().format("YYYY-MM-dd").getInfo();
      const ndviImageUrl = image.getThumbURL({
        dimensions: "400x400", // Image size
        region: point.buffer(bufferDistance).bounds().getInfo(), // Dynamic buffer based on zoom level
        min: 0.2,
        max: 1,
        bands: ["NDVI"],
        palette: ndviPalette, // Palette for NDVI values
      });

      const ndviValue = image
        .reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: point,
          scale: 30, // 30 meters per pixel
        })
        .get("NDVI")
        .getInfo();

      results.push({
        date,
        imageUrl: ndviImageUrl,
        ndviValue,
      });
    }

    // Return results as JSON
    res.json({ ndviImages: results });
  } catch (err) {
    console.error("Error fetching NDVI images:", err);
    res.status(500).json({ error: "Failed to fetch NDVI images." });
  }
});

app.get("/earth-engine-seasonal-ndvi", async (req, res) => {
  const { longitude, latitude } = req.query;

  if (!longitude || !latitude) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const targetPoint = ee.Geometry.Point([
      parseFloat(longitude),
      parseFloat(latitude),
    ]);

    // Define date ranges for each season
    const seasons = [
      { name: "Spring", start: "2024-03-01", end: "2024-05-31" },
      { name: "Summer", start: "2024-06-01", end: "2024-08-31" },
      { name: "Fall", start: "2024-09-01", end: "2024-11-30" },
      { name: "Winter", start: "2023-12-01", end: "2024-02-28" },
    ];

    let seasonalResults = [];

    await Promise.all(
      seasons.map(async (season) => {
        const landsatSR = ee
          .ImageCollection("LANDSAT/LC08/C02/T1_L2")
          .filterDate(season.start, season.end)
          .filterBounds(targetPoint)
          .select(["SR_B4", "SR_B5"]); // Select the red and NIR bands

        // Calculate NDVI
        const ndvi = landsatSR
          .map((image) =>
            image.normalizedDifference(["SR_B5", "SR_B4"]).rename("NDVI")
          )
          .mean(); // Mean NDVI for the season

        // Get NDVI value
        const ndviValue = await ndvi
          .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: targetPoint,
            scale: 30,
            maxPixels: 1e9,
          })
          .get("NDVI")
          .getInfo();

        seasonalResults.push({
          season: season.name,
          ndvi: ndviValue,
        });

        console.log(`Season: ${season.name}, NDVI: ${ndviValue}`);
      })
    );

    res.json({ seasonalResults });
  } catch (error) {
    console.error("Error retrieving Earth Engine data:", error);
    res.status(500).json({ error: "Failed to retrieve NDVI data" });
  }
});

const fetchLastOverpassPrediction = async (path, row, startDate, cycleDays) => {
  let result;
  let currentDate = new Date(startDate);

  for (let i = 0; i < cycleDays; i++) {
    const year = currentDate.getFullYear();
    const month = currentDate.toLocaleString("default", { month: "long" });
    const day = currentDate.getDate();

    result = await fetchOverpassPrediction(year, month, day, path, row);
    if (result.status === "success") {
      // Extract both date and time
      const lastOverpassDate = new Date(result.gregorianDate);
      lastOverpassDate.setDate(lastOverpassDate.getDate() + 16);

      // Extract time (assuming the format includes time)
      const time = result.gregorianDate.split(" ")[1]; // Gets the time from the gregorian date

      return {
        status: "success",
        message: `Next Landsat overpass for Path: ${path}, Row: ${row} is on ${
          lastOverpassDate.toISOString().split("T")[0]
        } at ${time}.`,
        nextOverpassDate: lastOverpassDate.toISOString().split("T")[0],
        nextOverpassTime: time, // Add time to the response
      };
    }

    currentDate.setDate(currentDate.getDate() - 1); // Decrement by 1 day
  }

  return {
    status: "error",
    message: "No overpass found in the last few days.",
  };
};

app.post("/predict-overpass", async (req, res) => {
  const { latitude, longitude, startDate } = req.body;

  if (!latitude || !longitude || !startDate) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized, no token provided" });
  }

  // Verify and decode the JWT token to get user information
  let userEmail;
  try {
    const decodedToken = jwt.verify(token, jwtSecret);
    userEmail = decodedToken.email;
    if (!userEmail) {
      return res
        .status(401)
        .json({ error: "Unauthorized, email not found in token" });
    }
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized, invalid token" });
  }

  const pathRows = await getPathRowFromLatLng(latitude, longitude);

  if (pathRows && pathRows.length > 0) {
    for (const { path, row } of pathRows) {
      console.log(`Checking overpass for Path: ${path}, Row: ${row}`);

      const predictionResult = await fetchLastOverpassPrediction(
        path,
        row,
        startDate,
        16 // 16-day Landsat cycle
      );

      if (predictionResult.status === "success") {
        // Compose the email message with both date and time
        const emailSubject = `Landsat Overpass Prediction for Path: ${path}, Row: ${row}`;
        const emailText = `The next Landsat overpass for Path: ${path} and Row: ${row} is on ${predictionResult.nextOverpassDate} at ${predictionResult.nextOverpassTime}.`;

        // Send the email to the user
        await sendEmailNotification(userEmail, emailSubject, emailText);

        return res.json({
          message: "Overpass found and email notification sent!",
          prediction: predictionResult,
        });
      }
    }

    return res.status(404).json({
      status: "error",
      message: "No overpass found for the given location.",
    });
  } else {
    return res
      .status(500)
      .json({ error: "Failed to retrieve Path/Row for the location." });
  }
});

app.get("/earth-engine-seasonal-ndvi", async (req, res) => {
  const { longitude, latitude } = req.query;

  if (!longitude || !latitude) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const targetPoint = ee.Geometry.Point([
      parseFloat(longitude),
      parseFloat(latitude),
    ]);

    // Define date ranges for each season
    const seasons = [
      { name: "Spring", start: "2024-03-01", end: "2024-05-31" },
      { name: "Summer", start: "2024-06-01", end: "2024-08-31" },
      { name: "Fall", start: "2024-09-01", end: "2024-11-30" },
      { name: "Winter", start: "2023-12-01", end: "2024-02-28" },
    ];

    let seasonalResults = [];

    await Promise.all(
      seasons.map(async (season) => {
        const landsatSR = ee
          .ImageCollection("LANDSAT/LC08/C02/T1_L2")
          .filterDate(season.start, season.end)
          .filterBounds(targetPoint)
          .select(["SR_B4", "SR_B5"]); // Select the red and NIR bands

        // Calculate NDVI
        const ndvi = landsatSR
          .map((image) =>
            image.normalizedDifference(["SR_B5", "SR_B4"]).rename("NDVI")
          )
          .mean(); // Mean NDVI for the season

        // Get NDVI value
        const ndviValue = await ndvi
          .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: targetPoint,
            scale: 30,
            maxPixels: 1e9,
          })
          .get("NDVI")
          .getInfo();

        seasonalResults.push({
          season: season.name,
          ndvi: ndviValue,
        });

        console.log(`Season: ${season.name}, NDVI: ${ndviValue}`);
      })
    );

    res.json({ seasonalResults });
  } catch (error) {
    console.error("Error retrieving Earth Engine data:", error);
    res.status(500).json({ error: "Failed to retrieve NDVI data" });
  }
});

// Start the server
app.listen(3001, () => {
  console.log("Server running on port 3001");
});
