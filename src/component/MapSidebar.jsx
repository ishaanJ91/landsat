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
          {/* Location Details (Mock Section for Google-like Sidebar) */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col items-center mb-3">
              {/* <img
                src={Pixel}
                alt="Location thumbnail"
                className="w-full my-3 rounded-lg"
              /> */}
              <div>
                <h2 className="font-bold text-lg">
                  Golden Gate National Recreation Area
                </h2>
              </div>
            </div>
            <p className="text-gray-700 text-sm">
              Coastal urban park with historic sites & activities from bicycling
              to hiking to water sports.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="p-4 flex justify-around border-b border-gray-200">
            <button className="flex flex-col items-center text-gray-800 hover:text-black">
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

              <span className="text-sm"> Save </span>
            </button>
            <button className="flex flex-col items-center text-gray-800 hover:text-black">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z"
                  clipRule="evenodd"
                />
              </svg>

              <span className="text-sm"> Download </span>
            </button>
          </div>

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

          {/* Date Picker, Path & Row Inputs */}
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-2">
              Satellite Overpass Data
            </h3>
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
  );
}

export default MapSidebar;
