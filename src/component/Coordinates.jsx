import React, { useState } from "react";

function Coordinates({
  inputLat,
  setInputLat,
  inputLng,
  setInputLng,
  handleInputChange,
}) {
  // State to control the dropdown visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Toggle dropdown visibility based on the current state
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="absolute top-3 right-3 z-20">
      {/* Dropdown Button */}
      <button
        onClick={toggleDropdown}
        className={`block w-52 bg-black px-4 py-2 rounded-lg focus:outline-none 
            ${isDropdownOpen ? "bg-white text-black" : "bg-black text-white"}`}
      >
        {isDropdownOpen ? "Hide Coordinates" : "Show Coordinates"}
      </button>

      {/* Dropdown Content */}
      {isDropdownOpen && (
        <div className="w-full mt-2 bg-white p-4 rounded-lg shadow-md">
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
              className="p-2 bg-black text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Update Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Coordinates;
