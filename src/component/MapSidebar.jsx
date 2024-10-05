import React, { useState, useEffect } from "react";
import { Autocomplete } from "@react-google-maps/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Loader } from "rsuite";
import Pixel from "../images/pixel.gif";
import axios from "axios";
import Sidebar from "./Sidebar";
import SidebarSwitch from "./SidebarSwitch";
import SaveSidebar from "./SaveSidebar";
import logo from "../images/logo.png";
import Cloud from "./Cloud";
import SurfaceTemp from "./SurfaceTemp";
import Chart from "./Chart";


const getPathRowFromLatLng = async (latitude, longitude) => {
  try {
    const url = `https://nimbus.cr.usgs.gov/arcgis/rest/services/LLook_Outlines/MapServer/1/query?where=MODE=%27D%27&geometry=${longitude},${latitude}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json`;

    const response = await axios.get(url);

    if (response.data && response.data.features && response.data.features.length > 0) {
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
  handlePlaceSelect,
  inputLat,
  setInputLat,
  inputLng,
  setInputLng,
  handleInputChange,
  selectedDate,
  setSelectedDate,
  fetchOverpassData,
  reverseGeocode,
  addressComponents,
  replacedUrl,
  shareUrl,
  ndviGrid,
  overpassData,
  handleCheckOverpass,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const handleFocus = () => setIsDropdownVisible(true);
  const handleBlur = () => setIsDropdownVisible(false);
  const [redirect, setRedirect] = useState(false);
  const [path, setPath] = useState("");
  const [row, setRow] = useState("");
  const [isSaveOpen, setIsSaveOpen] = useState(false); // State for save sidebar


  // Function to open the save sidebar
  const handleSaveClick = () => {
    setIsSaveOpen(true); // Open the Save overlay
  };

  // Function to close the save sidebar
  const closeSaveOverlay = () => {
    setIsSaveOpen(false); // Close the Save overlay
  };

  // Fetch path/row when latitude and longitude are set
  
  // useEffect(() => {
  //   if (inputLat && inputLng) {
  //     const fetchPathRow = async () => {
  //       const result = await getPathRowFromLatLng(inputLat, inputLng);
  //       if (result) {
  //         setPath(result.path);
  //         setRow(result.row);
  //       }
  //     };
  //     fetchPathRow();
  //   }
  // }, [inputLat, inputLng]);

  useEffect(() => {
    if (inputLat && inputLng) {
      setIsExpanded(true);
      handleCheckOverpass();
      // reverseGeocode(parseFloat(inputLat), parseFloat(inputLng)); // Call reverseGeocode with lat & lng
    }
  }, [inputLat, inputLng, reverseGeocode]);


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

  // Define CSV headers for NDVI grid values
  const ndviHeaders = ["Grid Index", "NDVI Value", "RGB Color"];

  // Define CSV rows for NDVI grid values
  const ndviRows = ndviGrid.map((pixel, index) => [
    `Cell ${index + 1}`,
    pixel.ndvi.toFixed(2),
    getNDVIColor(pixel.ndvi) // Get corresponding RGB value
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
  const blob = new Blob([fullCsvContent], { type: "text/csv;charset=utf-8;" });

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
        {/* Hamburger container */}
        <div className="p-3 mt-4">
          <img src={logo} alt="logo" className="w-10 h-10" />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col items-center py-4 space-y-6">

          <a
            onClick={handleSaveClick}
            className="p-2 text-gray-700 focus:outline-none transition-colors duration-200 rounded-lg dark:text-gray-200 dark:hover:bg-gray-800 hover:bg-gray-100"
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
            href="/charts"
            className="p-2 text-gray-700 focus:outline-none transition-colors duration-200 rounded-lg dark:text-gray-200 dark:hover:bg-gray-800 hover:bg-gray-100"
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
        </nav>
        <div className="flex flex-col items-center py-4 space-y-6">
          <a
            href="#"
            className="p-2 text-gray-700 focus:outline-none transition-colors duration-200 rounded-lg dark:text-gray-200 dark:hover:bg-gray-800 hover:bg-gray-100"
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
                d="M16.712 4.33a9.027 9.027 0 011.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 00-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 010 9.424m-4.138-5.976a3.736 3.736 0 00-.88-1.388 3.737 3.737 0 00-1.388-.88m2.268 2.268a3.765 3.765 0 010 2.528m-2.268-4.796a3.765 3.765 0 00-2.528 0m4.796 4.796c-.181.506-.475.982-.88 1.388a3.736 3.736 0 01-1.388.88m2.268-2.268l4.138 3.448m0 0a9.027 9.027 0 01-1.306 1.652c-.51.51-1.064.944-1.652 1.306m0 0l-3.448-4.138m3.448 4.138a9.014 9.014 0 01-9.424 0m5.976-4.138a3.765 3.765 0 01-2.528 0m0 0a3.736 3.736 0 01-1.388-.88 3.737 3.737 0 01-.88-1.388m2.268 2.268L7.288 19.67m0 0a9.024 9.024 0 01-1.652-1.306 9.027 9.027 0 01-1.306-1.652m0 0l4.138-3.448M4.33 16.712a9.014 9.014 0 010-9.424m4.138 5.976a3.765 3.765 0 010-2.528m0 0c.181-.506.475-.982.88-1.388a3.736 3.736 0 011.388-.88m-2.268 2.268L4.33 7.288m6.406 1.18L7.288 4.33m0 0a9.024 9.024 0 00-1.652 1.306A9.025 9.025 0 004.33 7.288"
              />
            </svg>
          </a>
        </div>
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

        <Chart latitude={inputLat} longitude={inputLng} />

      </div>

      {/* Conditionally render the SaveSidebar overlay */}
      {isSaveOpen && (
        <div className="fixed top-24 left-16 inset-0 bg-white  w-[400px] z-10 flex flex-col h-full max-h-[calc(100vh)] items-center justify-center">
          <SaveSidebar 
          onClose={closeSaveOverlay}
          convertToDegrees={convertToDegrees}
          setInputLat = {setInputLat}
          setInputLng = {setInputLng} />
        </div>
      )}

      

    </>
  );
}
