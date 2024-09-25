import React, { useState, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  GroundOverlay,
} from "@react-google-maps/api";
import axios from "axios";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

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
  const mapRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(10); // Store current zoom level
  const [overlayKey, setOverlayKey] = useState(Date.now()); // Key for re-rendering overlay

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

  return (
    <div className="map-container" style={{ position: "relative" }}>
      <LoadScript googleMapsApiKey="AIzaSyA93uKKAAe3IUGjHHe_yhW9vnHQQgzKCMA">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={zoomLevel}
          onClick={handleMapClick}
          onZoomChanged={handleZoomChange} // Handle zoom change
          onLoad={(map) => (mapRef.current = map)}
        >
          {marker && <Marker position={marker} />}

          {/* Display NDVI tile as GroundOverlay */}
          {tileUrl && marker && (
            <GroundOverlay
              key={overlayKey} // Force re-render by changing the key when marker or tile URL changes
              url={
                tileUrl
                  .replace("{z}", zoomLevel) // Replace {z} with zoom level
                  .replace(
                    "{x}",
                    latLngToTileCoords(marker.lat, marker.lng, zoomLevel).xTile
                  ) // Replace {x}
                  .replace(
                    "{y}",
                    latLngToTileCoords(marker.lat, marker.lng, zoomLevel).yTile
                  ) // Replace {y}
              }
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
      </LoadScript>

      <div style={infoWindowContainerStyle}>
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

        {marker && (
          <div style={infoWindowStyle}>
            <h3 style={infoTitleStyle}>Marker Location</h3>
            <p style={infoTextStyle}>
              Lat: {marker.lat.toFixed(6)}, Lng: {marker.lng.toFixed(6)}
            </p>
          </div>
        )}

        {ndviData && (
          <div style={infoWindowStyle}>
            <h3 style={infoTitleStyle}>NDVI Data</h3>
            <p>{ndviData}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Shifting the container slightly up and left
const infoWindowContainerStyle = {
  position: "absolute",
  bottom: "80px", // Moved slightly up
  left: "40px", // Moved slightly left
  zIndex: 1000, // Ensure it stays on top of the map
};

const inputContainerStyle = {
  display: "flex",
  flexDirection: "column",
  marginBottom: "10px", // Add space between inputs and the info window
  width: "220px", // Make input width match the info window width
};

const inputStyle = {
  marginBottom: "8px",
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  width: "100%", // Take full width of container
  backgroundColor: "rgba(250, 250, 250, 1)", // Semi-transparent light gray
  boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.6)",
};

const buttonStyle = {
  padding: "10px",
  backgroundColor: "rgba(20, 20, 20, 0.6)", // Darker gray button
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  width: "100%", // Take full width of container
  boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.6)",
};

const infoWindowStyle = {
  backgroundColor: "rgba(20, 20, 20, 0.6)", // Slight gray background for the info window
  padding: "12px",
  borderRadius: "5px",
  boxShadow: "0px 0px 10px rgba(0,0,0,0.4)",
  color: "white", // White text for contrast
  width: "220px", // Width matches the inputs
};

const infoTitleStyle = {
  marginBottom: "6px",
  fontSize: "16px",
  fontWeight: "bold",
};

const infoTextStyle = {
  fontSize: "14px",
};

export default React.memo(MyMap);
