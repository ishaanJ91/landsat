import React, { useState, useRef } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194, // Default to San Francisco
};

function MyMap() {
  const [marker, setMarker] = useState(null);
  const [inputLat, setInputLat] = useState("");
  const [inputLng, setInputLng] = useState("");

  const mapRef = useRef(null);

  const handleMapClick = (event) => {
    const newMarker = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    setMarker(newMarker);
    setInputLat(newMarker.lat.toFixed(6));
    setInputLng(newMarker.lng.toFixed(6));

    mapRef.current.panTo(newMarker);
  };

  const handleInputChange = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);

    if (!isNaN(lat) && !isNaN(lng)) {
      const newMarker = { lat, lng };
      setMarker(newMarker);

      mapRef.current.panTo(newMarker);
    }
  };

  return (
    <div className="map-container" style={{ position: "relative" }}>
      <LoadScript googleMapsApiKey="AIzaSyCQF6TTBXbrwNsPnm5HvYjE89CN3JOIYiw">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={10}
          mapId="fe5a6f3b7f15425f"
          options={{ mapId: "fe5a6f3b7f15425f" }}
          onClick={handleMapClick}
          onLoad={(map) => (mapRef.current = map)}
        >
          {marker && <Marker position={marker} />}
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
