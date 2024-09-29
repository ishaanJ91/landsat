import React, { useState, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  GroundOverlay,
  Autocomplete,
} from "@react-google-maps/api";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import DatePicker styles
import MapSidebar from "./MapSidebar";

// Move the libraries array outside the component to prevent reloading
const libraries = ["places"]; // Add 'places' to load Places API

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const customMapStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#bdbdbd",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#181818",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#1b1b1b",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [
      {
        color: "#2c2c2c",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#8a8a8a",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
      {
        color: "#373737",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#3c3c3c",
      },
    ],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [
      {
        color: "#4e4e4e",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#000000",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#3d3d3d",
      },
    ],
  },
];

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194, // Default to San Francisco
};

function latLngToTileCoords(lat, lng, zoom) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const xTile = Math.floor(((lng + 180) / 360) * n);
  const yTile = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { xTile, yTile };
}

function MyMap() {
  const [marker, setMarker] = useState(null);
  const [inputLat, setInputLat] = useState("");
  const [inputLng, setInputLng] = useState("");
  const [ndviData, setNdviData] = useState(null); // Store NDVI data
  const [tileUrl, setTileUrl] = useState(null); // Store NDVI tile URL
  const [path, setPath] = useState(""); // Store Path value for overpass prediction
  const [row, setRow] = useState(""); // Store Row value for overpass prediction
  const [selectedDate, setSelectedDate] = useState(new Date()); // Store selected date
  const [overpassData, setOverpassData] = useState(null); // Store overpass data
  const mapRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(10); // Store current zoom level
  const [overlayKey, setOverlayKey] = useState(Date.now()); // Key for re-rendering overlay
  const [autocomplete, setAutocomplete] = useState(null); // Store Autocomplete instance

  // Fetch NDVI data and tile URL from the backend based on the selected location
  const fetchNDVIData = async (lat, lng) => {
    try {
      const response = await axios.get(
        "http://localhost:3001/earth-engine-data",
        {
          params: { latitude: lat, longitude: lng },
        }
      );
      console.log("NDVI data:", response.data);
      setNdviData(response.data.ndvi); // Set NDVI data
      setTileUrl(response.data.tileUrl); // Set NDVI tile URL
      setOverlayKey(Date.now()); // Update key to force re-rendering of GroundOverlay
    } catch (error) {
      console.error("Error fetching NDVI data:", error);
    }
  };

  // Fetch Landsat overpass prediction from the backend based on Path, Row, and Date
  const fetchOverpassData = async () => {
    try {
      // Extract year, month, day from the selected date
      const selectedDateObj = new Date(selectedDate);
      const year = selectedDateObj.getFullYear();
      const month = selectedDateObj.toLocaleString("default", {
        month: "short",
      });
      const day = selectedDateObj.getDate();

      // Construct the URL with year, month, day, path, row
      const url = `http://localhost:3001/landsat-overpass?year=${year}&month=${month}&day=${day}&path=${path}&row=${row}`;

      // Log the generated URL for debugging
      console.log("Generated URL:", url);

      // Fetch data from the backend
      const response = await axios.get(url);

      console.log("Overpass data:", response.data);
      setOverpassData(response.data); // Set overpass data
    } catch (error) {
      console.error("Error fetching overpass data:", error);
    }
  };

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    const newMarker = {
      lat: lat,
      lng: lng,
    };

    setMarker(newMarker); // Place the marker
    setInputLat(lat.toFixed(6));
    setInputLng(lng.toFixed(6));

    mapRef.current.panTo(newMarker); // Center map on the new marker

    // Fetch NDVI data for the selected location
    fetchNDVIData(lat, lng);
  };

  const handleInputChange = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);

    if (!isNaN(lat) && !isNaN(lng)) {
      const newMarker = { lat, lng };
      setMarker(newMarker);
      mapRef.current.panTo(newMarker);

      // Fetch NDVI data for the input location
      fetchNDVIData(lat, lng);
    }
  };

  const handleZoomChange = () => {
    if (mapRef.current) {
      setZoomLevel(mapRef.current.getZoom());
    }
  };

  // Handle autocomplete place selection
  const handlePlaceSelect = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setMarker({ lat, lng });
      setInputLat(lat.toFixed(6));
      setInputLng(lng.toFixed(6));

      mapRef.current.panTo({ lat, lng });

      // Fetch NDVI data for the selected location
      fetchNDVIData(lat, lng);
    }
  };

  const onLoadAutocomplete = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  return (
    <div className="map-container" style={{ position: "relative" }}>
      <LoadScript
        googleMapsApiKey="AIzaSyBKAplgzV0XUC91sA9mAW4Bg3PWWh9GGDY"
        libraries={libraries} // Include the Places library
        onLoad={() => console.log("Google Maps API Loaded Successfully")}
        onError={(error) => console.error("Google Maps API Error:", error)}
      >
        {window.google && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={zoomLevel}
            mapTypeControl={true}
            onClick={handleMapClick}
            onZoomChanged={handleZoomChange}
            options={{
              styles: customMapStyle,
              mapTypeControl: false,
              minZoom: 3, // Set minimum zoom level to prevent excessive zooming out
              maxZoom: 18,
            }}
            onLoad={(map) => (mapRef.current = map)}
          >
            {marker && <Marker position={marker} />}

            {/* Display NDVI tile as GroundOverlay */}
            {tileUrl && marker && (
              <GroundOverlay
                key={overlayKey}
                url={tileUrl
                  .replace("{z}", zoomLevel)
                  .replace(
                    "{x}",
                    latLngToTileCoords(marker.lat, marker.lng, zoomLevel).xTile
                  )
                  .replace(
                    "{y}",
                    latLngToTileCoords(marker.lat, marker.lng, zoomLevel).yTile
                  )}
                bounds={{
                  north: marker.lat + 0.05,
                  south: marker.lat - 0.05,
                  east: marker.lng + 0.05,
                  west: marker.lng - 0.05,
                }}
                opacity={0.7}
              />
            )}
          </GoogleMap>
        )}

        {/* Autocomplete and Sidebar */}
        {/* <div className="sidebar" style={sidebarStyle}>
          <Autocomplete
            onLoad={onLoadAutocomplete}
            onPlaceChanged={handlePlaceSelect}
          >
            <input
              type="text"
              placeholder="Search for a location"
              style={autocompleteInputStyle}
            />
          </Autocomplete>

          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="Latitude"
              value={inputLat}
              onChange={(e) => setInputLat(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Longitude"
              value={inputLng}
              onChange={(e) => setInputLng(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleInputChange} style={buttonStyle}>
              Update Location
            </button>
          </div>

          <div style={inputContainerStyle}>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="yyyy-MM-dd"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              customInput={
                <input
                  type="text"
                  placeholder="Select Date"
                  style={inputStyle}
                  readOnly
                />
              }
            />
            <input
              type="text"
              placeholder="Path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Row"
              value={row}
              onChange={(e) => setRow(e.target.value)}
              style={inputStyle}
            />
            <button onClick={fetchOverpassData} style={buttonStyle}>
              Get Overpass Data
            </button>
          </div>
        </div> */}
        <MapSidebar
          onLoadAutocomplete={onLoadAutocomplete}
          handlePlaceSelect={handlePlaceSelect}
          inputLat={inputLat}
          setInputLat={setInputLat}
          inputLng={inputLng}
          setInputLng={setInputLng}
          handleInputChange={handleInputChange}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          path={path}
          setPath={setPath}
          row={row}
          setRow={setRow}
          fetchOverpassData={fetchOverpassData}
        />
      </LoadScript>
    </div>
  );
}

// Styles for the sidebar, inputs, and buttons
const sidebarStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "300px",
  height: "100%",
  backgroundColor: "#fff",
  padding: "20px",
  boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
};

const autocompleteInputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  marginBottom: "10px",
  fontSize: "16px",
};

const inputContainerStyle = {
  display: "flex",
  flexDirection: "column",
  marginBottom: "20px",
};

const inputStyle = {
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  marginBottom: "10px",
  fontSize: "16px",
};

const buttonStyle = {
  padding: "10px",
  backgroundColor: "#007BFF",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "16px",
};

export default React.memo(MyMap);
