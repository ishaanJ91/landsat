import React, { useState, useEffect } from "react";
import { Autocomplete } from "@react-google-maps/api";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import Sidebar from "./Sidebar";
import SidebarSwitch from "./SidebarSwitch";
import SaveSidebar from "./SaveSidebar";
import logo from "../images/logo.png";
import History from "./History";
import Chart from "./Chart";

const getPathRowFromLatLng = async (latitude, longitude) => {
  try {
    const url = `https://nimbus.cr.usgs.gov/arcgis/rest/services/LLook_Outlines/MapServer/1/query?where=MODE=%27D%27&geometry=${longitude},${latitude}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json`;

    const response = await axios.get(url);

    console.log(response.data); // Check if 'date' is part of the data

    if (
      response.data &&
      response.data.features &&
      response.data.features.length > 0
    ) {
      const { PATH, ROW } = response.data.features[0].attributes;
      return { path: PATH, row: ROW };
    } else {
      throw new Error("Failed to retrieve Path/Row for the given lat/lng.");
    }
  } catch (error) {
    console.error("Error fetching path/row from USGS API:", error);
    return null;
  }
};

export default function MapSidebar({
  onLoadAutocomplete,
  handleFocus,
  handleBlur,
  reverseGeocode,
  path,
  row,
  setRedirect,
  handlePlaceSelect,
  inputLat,
  inputLng,
  handleCheckOverpass,
  addressComponents,
  replacedUrl,
  shareUrl,
  ndviGrid,
  overpassData,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [activeButton, setActiveButton] = useState("");
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  // Function to open the save sidebar
  const handleSaveClick = () => {
    setIsSaveOpen(true);
  };

  // Function to close the save sidebar
  const closeSaveOverlay = () => {
    setIsSaveOpen(false);
  };

  // Function to open the History graph popup
  const handleGraphClick = () => {
    setIsGraphOpen(true);
  };

  // Function to close the History graph popup
  const closeGraphOverlay = () => {
    setIsGraphOpen(false);
  };

  const DEBOUNCE_DELAY = 10000;

  useEffect(() => {
    if (inputLat && inputLng) {
      setIsExpanded(true);
      handleCheckOverpass();

      // Create a debounce function for reverseGeocode
      // const timer = setTimeout(() => {
      //   reverseGeocode(parseFloat(inputLat), parseFloat(inputLng));
      // }, DEBOUNCE_DELAY);

      // // Clear timeout if inputs change or component unmounts
      // return () => clearTimeout(timer);
    }
  }, [inputLat, inputLng]);

  // Expand the sidebar when the user selects a location from Autocomplete
  const onPlaceSelected = () => {
    handlePlaceSelect();
    setIsExpanded(true);
  };

  // // Watch for latitude and longitude updates to expand the sidebar
  useEffect(() => {
    // Expand the sidebar when both latitude and longitude are set
    if (inputLat && inputLng) {
      setIsExpanded(true);
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

    // Prepare the NDVI grid data with RGB values
    const ndviGridWithColors = ndviGrid.map((pixel) => ({
      ndvi: pixel.ndvi.toFixed(2), // NDVI value rounded to two decimal places
      rgb: getNDVIColor(pixel.ndvi), // Get the corresponding RGB value
    }));

    const locationData = {
      image: replacedUrl,
      locationName: addressComponents.state || "Unavailable",
      region: addressComponents.country || "Unavailable",
      coordinates: {
        latitude: inputLat,
        longitude: inputLng,
      },
      ndviGrid: ndviGridWithColors, // Include the NDVI grid with RGB values
    };

    try {
      await axios.post("/save", locationData);
      setRedirect(true);
    } catch (error) {
      console.error("Error saving location data:", error);
    }
  }

  const getNDVIColor = (ndvi) => {
    if (ndvi < 0) return "#FF0000"; // Red for low NDVI
    if (ndvi < 0.2) return "#FFA500"; // Orange
    if (ndvi < 0.4) return "#FFFF00"; // Yellow
    if (ndvi < 0.6) return "#ADFF2F"; // Light green
    return "#008000"; // Dark green
  };

  // Function to convert data to CSV format and trigger download
  // Function to convert data to CSV format and trigger download
  const downloadCSV = () => {
    // Define CSV headers for location details
    const locationHeaders = [
      "Latitude",
      "Longitude",
      "Country",
      "Region",
      "NDVI Image Link",
      "Download Date",
      "Download time",
    ];

    // Define CSV rows for location details
    const locationRows = [
      [
        inputLat,
        inputLng,
        addressComponents?.country || "Unavailable",
        addressComponents?.state || "Unavailable",
        replacedUrl || "Unavailable",
        new Date().toLocaleDateString("en-GB"), // Date in DD/MM/YYYY format
        new Date().toLocaleTimeString(), // Time in HH:MM:SS format
      ],
    ];

    const onPlaceSelected = () => {
      handlePlaceSelect();
      setIsExpanded(true);
    };

    // Define CSV headers for NDVI grid values
    const ndviHeaders = ["Grid Index", "NDVI Value", "RGB Color"];

    // Define CSV rows for NDVI grid values
    const ndviRows = ndviGrid.map((pixel, index) => [
      `Cell ${index + 1}`,
      pixel.ndvi.toFixed(2),
      getNDVIColor(pixel.ndvi), // Get corresponding RGB value
    ]);

    // Create CSV content for location details
    const locationCsvContent = [
      locationHeaders.join(","), // Header row
      ...locationRows.map((row) => row.join(",")), // Data rows
    ].join("\n");

    // Create CSV content for NDVI grid values
    const ndviCsvContent = [
      ndviHeaders.join(","), // Header row
      ...ndviRows.map((row) => row.join(",")), // Data rows
    ].join("\n");

    // Combine both CSV contents into a single CSV file
    const fullCsvContent = `${locationCsvContent}\n\nNDVI Grid Values\n${ndviCsvContent}`;

    // Create a Blob from CSV data
    const blob = new Blob([fullCsvContent], {
      type: "text/csv;charset=utf-8;",
    });

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
      <aside className="fixed top-0 left-0 h-full bg-gray-900">
        <div className="p-3 mt-4">
          <img src={logo} alt="logo" className="w-10 h-10" />
        </div>

        <nav className="flex flex-col mt-6 justify-between flex-grow h-4/5 border-t-1 border-gray-800 items-center pt-4">
          <div className="flex flex-col mt-2 gap-5 justify-between">
            <a
              onClick={handleSaveClick} // Open the SaveSidebar on click
              className={`p-2 focus:outline-none transition-colors duration-200 rounded-lg ${
                activeButton === "save"
                  ? "bg-gray-700 text-white" // Active style
                  : "text-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 hover:bg-gray-100"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
                  clipRule="evenodd"
                />
              </svg>
            </a>

            <a
              onClick={handleGraphClick}
              className={`p-2 focus:outline-none transition-colors duration-200 rounded-lg ${
                activeButton === "graph"
                  ? "bg-gray-700 text-white" // Active style
                  : "text-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 hover:bg-gray-100"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </a>
          </div>

          <div className="flex flex-col gap-5 border-gray-800 w-full items-center justify-between">
            <a
              className={`p-2 focus:outline-none transition-colors duration-200 rounded-lg ${
                activeButton === "cloud"
                  ? "bg-gray-700 text-white" // Active style
                  : "text-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 hover:bg-gray-100"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-7"
              >
                <path
                  fillRule="evenodd"
                  d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </a>

            <a
              className={`p-2 focus:outline-none transition-colors duration-200 rounded-lg ${
                activeButton === "temp"
                  ? "bg-gray-700 text-white" // Active style
                  : "text-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 hover:bg-gray-100"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-8"
              >
                <path
                  fillRule="evenodd"
                  d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </nav>
      </aside>

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
          <SidebarSwitch
            ndviGrid={ndviGrid}
            addressComponents={addressComponents}
            inputLat={inputLat}
            inputLng={inputLng}
            path={path}
            row={row}
            overpassData={overpassData}
            getNDVIColor={getNDVIColor}
            saveLocationData={saveLocationData}
            downloadCSV={downloadCSV}
            shareLocation={shareLocation}
            convertToDegrees={convertToDegrees}
          />
        )}

        {/* <Chart latitude={inputLat} longitude={inputLng} /> */}
      </div>

      {/* Conditionally render the SaveSidebar overlay */}
      {isSaveOpen && (
        <div className="fixed top-24 left-16 inset-0 bg-white w-[400px] z-10 flex flex-col h-full max-h-[calc(100vh)] items-center justify-center">
          <SaveSidebar onClose={closeSaveOverlay} />
        </div>
      )}

      {isGraphOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white w-4/5 h-4/5 rounded-lg shadow-lg overflow-y-auto">
            <button
              onClick={closeGraphOverlay}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              ✕ {/* Close button */}
            </button>
            <History
              latitude={inputLat}
              longitude={inputLng}
              addressComponents={addressComponents}
              onClose={closeGraphOverlay}
            />
          </div>
        </div>
      )}
    </>
  );
}
