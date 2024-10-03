import React, { useState, useEffect } from "react";
import { Autocomplete } from "@react-google-maps/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Loader } from "rsuite";
import Pixel from "../images/pixel.gif";
import axios from "axios";
import Sidebar from "./Sidebar";

export default function MapSidebar({
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
  reverseGeocode,
  addressComponents,
  replacedUrl,
  shareUrl,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const handleFocus = () => setIsDropdownVisible(true);
  const handleBlur = () => setIsDropdownVisible(false);
  const [redirect, setRedirect] = useState(false);

  // Expand the sidebar when the user selects a location from Autocomplete
  const onPlaceSelected = () => {
    handlePlaceSelect();
    setIsExpanded(true);
  };

  // Watch for latitude and longitude updates to expand the sidebar
  useEffect(() => {
    // Expand the sidebar when both latitude and longitude are set
    if (inputLat && inputLng) {
      setIsExpanded(true);
      reverseGeocode(parseFloat(inputLat), parseFloat(inputLng)); // Call reverseGeocode with lat & lng
    }
  }, [inputLat, inputLng, reverseGeocode]);

  const convertToDegrees = (coord, type) => {
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutes = Math.floor((absolute - degrees) * 60);
    const seconds = Math.round((absolute - degrees - minutes / 60) * 3600);

    const direction =
      type === "lat" ? (coord >= 0 ? "N" : "S") : coord >= 0 ? "E" : "W";

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  };

  async function saveLocationData(ev) {
    ev.preventDefault();

    const locationData = {
      image: replacedUrl,
      locationName: addressComponents.state || "Unavailable",
      region: addressComponents.country || "Unavailable",
      coordinates: {
        latitude: inputLat,
        longitude: inputLng,
      },
    };

    try {
      await axios.post("/save", locationData);
      setRedirect(true);
    } catch (error) {
      console.error("Error saving location data:", error);
    }
  }

  // Function to convert data to CSV format and trigger download
  const downloadCSV = () => {
    // Define CSV headers
    const headers = [
      "Latitude",
      "Longitude",
      "Country",
      "Region",
      "NDVI Image Link",
      "Download Date",
      "Download time",
    ];

    // Define CSV rows
    const rows = [
      [
        inputLat,
        inputLng,
        addressComponents?.country || "Unavailable",
        addressComponents?.region || "Unavailable",
        replacedUrl || "Unavailable",
        new Date().toLocaleDateString("en-GB"), // Date in DD/MM/YYYY format
        new Date().toLocaleTimeString(), // Time in HH:MM:SS format
      ],
    ];

    // Create CSV content
    const csvContent = [
      headers.join(","), // Header row
      ...rows.map((row) => row.join(",")), // Data rows
    ].join("\n");

    // Create a Blob from CSV data
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a link element to trigger download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `NDVI_Data_${new Date().toISOString()}.csv`);
    link.style.visibility = "hidden";

    // Append link to body and trigger click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareLocation = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("Shareable link copied to clipboard!");
    });
  };

  return (
    <>
      <Sidebar className="z-50" />
      <div
        className={`absolute top-0 left-16 w-[400px] z-10 flex flex-col ${
          isExpanded
            ? "h-full max-h-[calc(100vh)] bg-white top-0! overflow-y-auto"
            : "h-auto"
        }`}
      >
        <div className="sticky top-0 bg-none z-50 px-3 py-2">
          <Autocomplete
            onLoad={onLoadAutocomplete}
            onPlaceChanged={onPlaceSelected}
            className={`w-full shadow-lg rounded-3xl bg-white py-1 mt-3 text-gray-700 focus:outline-none
              isDropdownVisible
                    ? "rounded-t-3xl rounded-b-none"
                    : "rounded-3xl " 
                }`}
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
                className={`w-full py-3 pl-16 rounded-2xl pr-4 placeholder-gray-600 text-sm focus:outline-none${
                  isDropdownVisible
                    ? "rounded-t-2xl rounded-b-none" // Flat bottom border when visible
                    : "rounded-2xl " // Fully rounded when not visible
                }`}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          </Autocomplete>
        </div>

        {isExpanded && (
          <>
            {/* Location Details (Mock Section for Google-like Sidebar) */}
            <div className="border-b border-gray-200 pb-4">
              <div className="px-4 mt-6 flex flex-col">
                <img
                  src={Pixel}
                  alt="Location thumbnail"
                  className="w-full my-3 rounded-lg"
                />
                {addressComponents && (
                  <div className="flex py-2 flex-row items-end align-baseline">
                    <div className="flex flex-col mb-2">
                      <h2 className="text-2xl font-medium">
                        {addressComponents.state || "Unavailable"}
                      </h2>
                      <h2 className="text-lg -mt-1 text-gray-700">
                        {" "}
                        {addressComponents.country}{" "}
                      </h2>
                    </div>

                    <div className="flex flex-col ml-auto mb-2 pb-1">
                      <span className="text-sm text-gray-800">
                        {" "}
                        {convertToDegrees(inputLat, "lat")}{" "}
                      </span>
                      <span className="text-sm text-gray-800">
                        {" "}
                        {convertToDegrees(inputLng, "lng")}
                      </span>{" "}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 flex justify-around border-b border-gray-200">
              <button
                onClick={saveLocationData}
                className="flex flex-col items-center text-gray-800 hover:text-black"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs pt-1"> Save </span>
              </button>
              <button
                onClick={downloadCSV}
                className="flex flex-col items-center text-gray-800 hover:text-black"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z"
                    clipRule="evenodd"
                  />
                </svg>

                <span className="text-xs pt-1"> Download </span>
              </button>
              <button
                onClick={shareLocation}
                className="flex flex-col items-center text-gray-800 hover:text-black"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs pt-1"> Share </span>
              </button>
            </div>

            {/* Date Picker, Path & Row Inputs */}
            <div className="px-4 mt-2 pt-4">
              <h2 className="text-2xl font-medium">Satellite Overpass Data</h2>
              <div className="flex flex-col mb-4">
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
                      className="p-2 mb-2 border border-gray-300 rounded-lg text-sm"
                      readOnly
                    />
                  }
                />

                <div className="flex flex-row gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Path"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    className="p-2 mb-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Row"
                    value={row}
                    onChange={(e) => setRow(e.target.value)}
                    className="p-2 mb-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <button
                  onClick={fetchOverpassData}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Get Overpass Data
                </button>
              </div>
            </div>

            <div className="px-4 mt-2 pt-4">
              <h2 className="text-2xl font-medium">Satellite Overpass Data</h2>
              <div className="flex flex-col mb-4">
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
                      className="p-2 mb-2 border border-gray-300 rounded-lg text-sm"
                      readOnly
                    />
                  }
                />

                <div className="flex flex-row gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Path"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    className="p-2 mb-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Row"
                    value={row}
                    onChange={(e) => setRow(e.target.value)}
                    className="p-2 mb-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <button
                  onClick={fetchOverpassData}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Get Overpass Data
                </button>
              </div>
            </div>

            <div className="px-4 mt-2 pt-4">
              <h2 className="text-2xl font-medium">Satellite Overpass Data</h2>
              <div className="flex flex-col mb-4">
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
                      className="p-2 mb-2 border border-gray-300 rounded-lg text-sm"
                      readOnly
                    />
                  }
                />

                <div className="flex flex-row gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Path"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    className="p-2 mb-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Row"
                    value={row}
                    onChange={(e) => setRow(e.target.value)}
                    className="p-2 mb-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <button
                  onClick={fetchOverpassData}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Get Overpass Data
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
