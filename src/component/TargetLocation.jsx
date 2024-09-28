import React, { useState, useRef, useCallback } from "react";
import {
  GoogleMap,
  LoadScriptNext,
  Marker,
  GroundOverlay,
  Autocomplete,
} from "@react-google-maps/api";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const libraries = ["places"];

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
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
  const [ndviData, setNdviData] = useState(null);
  const [tileUrl, setTileUrl] = useState(null);
  const [path, setPath] = useState("");
  const [row, setRow] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [overpassData, setOverpassData] = useState(null);
  const mapRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [overlayKey, setOverlayKey] = useState(Date.now());
  const [autocomplete, setAutocomplete] = useState(null);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const fetchNDVIData = async (lat, lng) => {
    try {
      const response = await axios.get(
        "http://localhost:3001/earth-engine-data",
        {
          params: { latitude: lat, longitude: lng },
        }
      );
      setNdviData(response.data.ndvi);
      setTileUrl(response.data.tileUrl);
      setOverlayKey(Date.now());
    } catch (error) {
      console.error("Error fetching NDVI data:", error);
    }
  };

  const fetchOverpassData = async () => {
    try {
      const selectedDateObj = new Date(selectedDate);
      const year = selectedDateObj.getFullYear();
      const month = selectedDateObj.toLocaleString("default", {
        month: "short",
      });
      const day = selectedDateObj.getDate();
      const url = `http://localhost:3001/landsat-overpass?year=${year}&month=${month}&day=${day}&path=${path}&row=${row}`;
      const response = await axios.get(url);
      setOverpassData(response.data);
    } catch (error) {
      console.error("Error fetching overpass data:", error);
    }
  };

  const handleZoomChange = useCallback(
    debounce(() => {
      if (mapRef.current) {
        setZoomLevel(mapRef.current.getZoom());
      }
    }, 300),
    []
  );

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const newMarker = { lat, lng };
    setMarker(newMarker);
    setInputLat(lat.toFixed(6));
    setInputLng(lng.toFixed(6));
    mapRef.current.panTo(newMarker);
    fetchNDVIData(lat, lng);
  };

  const handleInputChange = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const newMarker = { lat, lng };
      setMarker(newMarker);
      mapRef.current.panTo(newMarker);
      fetchNDVIData(lat, lng);
    }
  };

  const handlePlaceSelect = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setMarker({ lat, lng });
      setInputLat(lat.toFixed(6));
      setInputLng(lng.toFixed(6));
      mapRef.current.panTo({ lat, lng });
      fetchNDVIData(lat, lng);
    }
  };

  const onLoadAutocomplete = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  return (
    <div className="map-container" style={{ position: "relative" }}>
      <LoadScriptNext
        googleMapsApiKey="AIzaSyBKAplgzV0XUC91sA9mAW4Bg3PWWh9GGDY"
        libraries={libraries}
        onLoad={() => console.log("Google Maps API Loaded Successfully")}
        onError={(error) => console.error("Google Maps API Error:", error)}
      >
        <div className="sidebar" style={sidebarStyle}>
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
        </div>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={zoomLevel}
          onClick={handleMapClick}
          onZoomChanged={handleZoomChange}
          options={{
            mapId: "56fe3a15c4207d19",
            zoomControl: false,
            scaleControl: false,
            rotateControl: true,
            cameraControl: true,
            gestureHandling: "none",
          }}
          onLoad={(map) => (mapRef.current = map)}
        >
          {marker && <Marker position={marker} />}

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
      </LoadScriptNext>
    </div>
  );
}

// Styles for the input and info windows
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
