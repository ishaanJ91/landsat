import React, { useState, useRef, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  MarkerF,
  GroundOverlay,
  Autocomplete,
} from "@react-google-maps/api";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css"; // Import DatePicker styles
import MapSidebar from "./MapSidebar";
import Coordinates from "./Coordinates";
import { useLocation, useNavigate } from "react-router-dom"; // Import useLocation & useHistory

// Move the libraries array outside the component to prevent reloading
const libraries = ["places"]; // Add 'places' to load Places API

const replaceXYZ = (url, lat, lng, zoom) => {
  const { xTile, yTile } = latLngToTileCoords(lat, lng, zoom);
  const replacedUrl = url
    .replace("{z}", zoom) // Replace {z} with zoom level
    .replace("{x}", xTile) // Replace {x} with x tile coordinate
    .replace("{y}", yTile); // Replace {y} with y tile coordinate
  return replacedUrl;
};

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
  lat: 53.3498,
  lng: -6.2603,
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
  const [ndviGrid, setNdviGrid] = useState(null);
  const [tileUrl, setTileUrl] = useState(null); // Store NDVI tile URL
  const [path, setPath] = useState(""); // Store Path value for overpass prediction
  const [row, setRow] = useState(""); // Store Row value for overpass prediction
  const [selectedDate, setSelectedDate] = useState(new Date()); // Store selected date
  const [overpassData, setOverpassData] = useState(null); // Store overpass data
  const mapRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(10); // Store current zoom level
  const [overlayKey, setOverlayKey] = useState(Date.now()); // Key for re-rendering overlay
  const [autocomplete, setAutocomplete] = useState(null); // Store Autocomplete instance
  const [addressComponents, setAddressComponents] = useState({});
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const formatDateTime = (dateString) => {
    const dateObj = new Date(dateString);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString("default", { month: "long" });
    const year = dateObj.getFullYear();

    // Get the appropriate suffix for the day
    const daySuffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";

    return `${day}${daySuffix} ${month}, ${year}`;
  };

  useEffect(() => {
    if (marker) {
      fetchNDVIData(marker.lat, marker.lng);
    }
  }, [marker]);

  const generateShareURL = () => {
    if (marker) {
      const baseURL = window.location.origin;
      const lat = marker.lat.toFixed(6);
      const lng = marker.lng.toFixed(6);
      const zoom = zoomLevel;

      // Create URL with query params for lat, lng, and zoom
      const shareURL = `${baseURL}/dashboard/target-location?lat=${lat}&lng=${lng}&zoom=${zoom}`;
      return shareURL;
    }
    return null;
  };

  // Parse the URL parameters on initial load and set marker state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const lat = parseFloat(params.get("lat"));
    const lng = parseFloat(params.get("lng"));
    const zoom = parseInt(params.get("zoom"), 10);

    // If URL parameters are valid, set marker state and center map
    if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoom)) {
      const newMarker = { lat, lng };
      setMarker(newMarker);
      setInputLat(lat.toFixed(6));
      setInputLng(lng.toFixed(6));
      setZoomLevel(zoom);

      // Pan map to marker position
      if (mapRef.current) {
        mapRef.current.panTo(newMarker);
      }
    }
  }, [location.search]);

  useEffect(() => {
    if (marker) {
      const formattedLat = marker.lat.toFixed(6);
      const formattedLng = marker.lng.toFixed(6);

      // Update the URL with the new location
      navigate(
        `/dashboard/target-location?lat=${formattedLat}&lng=${formattedLng}&zoom=${zoomLevel}`,
        { replace: true }
      );
    }
  }, [marker, zoomLevel, navigate]);

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
      setNdviGrid(response.data.ndviPixels); // Set the 3x3 NDVI grid
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
      const formattedDate = formatDateTime(
        response.data.date,
        response.data.time
      );

      setOverpassData({
        date: formattedDate,
      });
    } catch (error) {
      console.error("Error fetching overpass data:", error);
    }
  };

  const handleCheckOverpass = async (lat, lng) => {
    console.log("Checking overpass for Lat:", lat, "Lng:", lng); // Log the lat/lng values

    if (!lat || !lng) {
      console.log("Invalid Lat/Long"); // Log invalid input
      setError("Please enter valid latitude and longitude.");
      return;
    }

    const startDate = new Date().toISOString().split("T")[0]; // Log current date
    console.log("Start Date:", startDate); // Log start date

    try {
      const response = await axios.post(
        "http://localhost:3001/predict-overpass",
        {
          latitude: lat,
          longitude: lng,
          startDate,
        }
      );

      console.log("Response from overpass prediction:", response.data); // Log response data
      setOverpassData({
        date: response.data.prediction.nextOverpassDate,
        time: response.data.prediction.nextOverpassTime,
      }); // Store the response data
      setError(null); // Clear error if successful
    } catch (error) {
      console.error("Error checking overpass:", error); // Log error
      setError("Failed to fetch overpass data");
    }
  };

  const convertLatLngToPathRow = async (lat, lng) => {
    try {
      const response = await axios.post(
        "http://localhost:3001/convert-latlng-to-pathrow",
        {
          latitude: lat,
          longitude: lng,
        }
      );
      console.log("Path/Row Conversion:", response.data); // Log the path and row conversion result
      return response.data;
    } catch (error) {
      console.error("Error converting lat/lng to path/row:", error);
    }
  };

  // Call this function when a user clicks on the map or enters lat/lng manually
  const handleLocationSelect = async (lat, lng) => {
    const pathRow = await convertLatLngToPathRow(lat, lng);
    console.log("Converted Path/Row:", pathRow); // Log the conversion to the console
  };

  const handleMapClick = async (event) => {
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
    handleCheckOverpass(lat, lng);
    await handleLocationSelect(lat, lng);
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
      handleCheckOverpass(lat, lng);
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
      handleCheckOverpass(lat, lng);
    }
  };

  const onLoadAutocomplete = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const reverseGeocode = (lat, lng) => {
    const geocoder = new window.google.maps.Geocoder();
    const location = { lat, lng };

    geocoder.geocode({ location }, (results, status) => {
      if (status === "OK" && results[0]) {
        // Extract relevant address components (e.g., country, state, region)
        const addressDetails = results[0].address_components.reduce(
          (acc, component) => {
            if (component.types.includes("country")) {
              acc.country = component.long_name;
            }
            if (component.types.includes("administrative_area_level_1")) {
              acc.state = component.long_name;
            }
            if (component.types.includes("administrative_area_level_2")) {
              acc.region = component.long_name;
            }
            return acc;
          },
          {}
        );

        // Update the state with address details
        setAddressComponents(addressDetails);
      } else {
        console.error("Geocode error:", status);
      }
    });
  };

  const replacedUrl =
    tileUrl && marker && replaceXYZ(tileUrl, marker.lat, marker.lng, zoomLevel);

  useEffect(() => {
    console.log("Address Components:", addressComponents);
  }, [addressComponents]);

  return (
    <div
      tabIndex="-1"
      className="map-container no-focus-outline"
      style={{ position: "relative" }}
    >
      <LoadScript
        googleMapsApiKey="YOUR_API_KEY"
        libraries={libraries}
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
              zoomControl: true,
              mapTypeControl: false,
              fullscreenControl: false,
              minZoom: 3, // Set minimum zoom level to prevent excessive zooming out
              maxZoom: 18,
            }}
            onLoad={(map) => (mapRef.current = map)}
          >
            {marker && <MarkerF position={marker} />}

            {/* Display NDVI tile as GroundOverlay */}
            {tileUrl && marker && (
              <GroundOverlay
                key={overlayKey}
                url={replaceXYZ(tileUrl, marker.lat, marker.lng, zoomLevel)}
                bounds={{
                  north: marker.lat + 0.05,
                  south: marker.lat - 0.05,
                  east: marker.lng + 0.05,
                  west: marker.lng - 0.05,
                }}
              />
            )}
          </GoogleMap>
        )}

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
          reverseGeocode={reverseGeocode}
          addressComponents={addressComponents}
          replacedUrl={replacedUrl}
          shareUrl={generateShareURL()}
          handleCheckOverpass={handleCheckOverpass}
          ndviGrid={ndviGrid}
          overpassData={overpassData}
        />

        <Coordinates
          inputLat={inputLat}
          setInputLat={setInputLat}
          inputLng={inputLng}
          setInputLng={setInputLng}
          handleInputChange={handleInputChange}
        />
      </LoadScript>
    </div>
  );
}

export default React.memo(MyMap);
