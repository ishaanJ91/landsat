import React, { useState, useEffect } from "react";
import { Autocomplete } from "@react-google-maps/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Loader } from "rsuite";
// import Pixel from "../images/pixel.gif";

function MapSidebar({
  onLoadAutocomplete,
  handlePlaceSelect,
  inputLat,
  setInputLat,
  inputLng,
  setInputLng,
  handleInputChange,
  selectedDate,
  setSelectedDate,
  path,
  setPath,
  row,
  setRow,
  fetchOverpassData,
  ndviGrid, // Add ndviGrid prop
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Expand the sidebar when the user selects a location from Autocomplete
  const onPlaceSelected = () => {
    handlePlaceSelect();
    setIsExpanded(true); // Expand sidebar
  };

  // Watch for latitude and longitude updates to expand the sidebar
  useEffect(() => {
    // Expand the sidebar when both latitude and longitude are set
    if (inputLat && inputLng) {
      setIsExpanded(true);
    }
  }, [inputLat, inputLng]);

  // Helper function to get NDVI color
  const getNDVIColor = (ndvi) => {
    if (ndvi < 0) return "#FF0000"; // Red for low NDVI
    if (ndvi < 0.2) return "#FFA500"; // Orange
    if (ndvi < 0.4) return "#FFFF00"; // Yellow
    if (ndvi < 0.6) return "#ADFF2F"; // Light green
    return "#008000"; // Dark green
  };

  return (
    <div
      className={`absolute top-3 left-3 rounded-t-2xl w-[350px] ${
        isExpanded ? "h-4/5" : "h-auto"
      } bg-white shadow-md z-10 flex flex-col overflow-y-auto transition-all duration-300`}
    >
      {/* Search Box */}
      <Autocomplete
        onLoad={onLoadAutocomplete}
        onPlaceChanged={onPlaceSelected}
        className="mt-1 border-b-2 border-gray-200 outline-none"
      >
        <div className="relative">
          {/* Search Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-gray-600 absolute left-5 top-1/2 transform -translate-y-1/2"
          >
            <path
              fillRule="evenodd"
              d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"
              clipRule="evenodd"
            />
          </svg>
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search for a location"
            className="w-full py-3 pl-16 pr-4 placeholder-gray-600 focus:outline-none focus:border-gray-400 text-sm"
          />
        </div>
      </Autocomplete>

      {isExpanded && (
        <>
          {/* Latitude & Longitude Inputs */}
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-2">Update Location</h3>
            <div className="flex flex-col mb-4">
              <input
                type="text"
                placeholder="Latitude"
                value={inputLat}
                onChange={(e) => setInputLat(e.target.value)}
                className="p-2 mb-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Longitude"
                value={inputLng}
                onChange={(e) => setInputLng(e.target.value)}
                className="p-2 mb-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleInputChange}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                Update Location
              </button>
            </div>
          </div>

          {/* NDVI Grid Display */}
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-2">NDVI Grid</h3>
            {ndviGrid ? (
              <div className="grid grid-cols-3 gap-1">
                {ndviGrid.map((pixel, index) => (
                  <div
                    key={index}
                    className="w-10 h-10"
                    style={{
                      backgroundColor: getNDVIColor(pixel.ndvi),
                      border: "1px solid #ddd",
                    }}
                  >
                    {/* Display NDVI value inside the box */}
                    <span className="text-xs text-white">
                      {pixel.ndvi.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No NDVI data available</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MapSidebar;
