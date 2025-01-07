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
  // State to control the hover tooltip
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // NDVI ranges and corresponding classes
  const ndviClasses = [

    { value: '1.00', color: '#006600', label: 'Dense Vegetation (NDVI > 0.5)' },
    { value: '0.90', color: '#007700', label: 'Dense Vegetation (NDVI > 0.5)' },
    { value: '0.80', color: '#008800', label: 'Dense Vegetation (NDVI > 0.5)' },
    { value: '0.70', color: '#00AA00', label: 'Dense Vegetation (NDVI > 0.5)' },
    { value: '0.60', color: '#00FF00', label: 'Dense Vegetation (NDVI > 0.5)' },
    { value: '0.50', color: '#FFFF00', label: 'Moderate Vegetation (0.3 - 0.5)' },
    { value: '0.40', color: '#FFCC00', label: 'Moderate Vegetation (0.3 - 0.5)'},
    { value: '0.30', color: '#FF9900', label: 'Sparse Vegetation (0.03 - 0.3)' },
    { value: '0.20', color: '#FF6600', label: 'Bare Soil (0 - 0.03)'},
    { value: '0.10', color: '#FF3300', label: 'Bare Soil (0 - 0.03)' },
    { value: '0.00', color: '#FF0000', label: 'Water (NDVI < 0)'},
  ];

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
            ${isDropdownOpen ? "bg-black text-white" : "bg-black text-white"}`}
      >
        {isDropdownOpen ? "Hide Coordinates" : "Show Coordinates"}
      </button>

      {/* Dropdown Content */}
      {isDropdownOpen && (
        <div className="w-full mt-2 bg-black p-4 rounded-lg shadow-md">
          {/* Coordinates Input Section */}
          <div className="flex flex-col mb-4">
            <input
              type="text"
              placeholder="Latitude"
              value={inputLat}
              onChange={(e) => setInputLat(e.target.value)}
              className="p-2 mb-2 border border-black rounded-lg text-center text-sm"
            />
            <input
              type="text"
              placeholder="Longitude"
              value={inputLng}
              onChange={(e) => setInputLng(e.target.value)}
              className="p-2 mb-2 border border-black text-center rounded-lg text-sm"
            />
            <button
              onClick={handleInputChange}
              className="p-2 bg-white text-black rounded-lg text-sm"
            >
              Update Location
            </button>
          </div>
        </div>
      )}

      {/* Spectrum Legend */}
      <div className="absolute top-60 -right-2 items-center bg-black px-4 py-2 text-white rounded-lg ml-auto">
        <div className="flex flex-col">
          {ndviClasses.map((item, index) => (
            <div
              key={index}
              className="flex items-center mb-1 relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Color block */}
              <div
                className="w-8 h-4"
                style={{
                  backgroundColor: item.color,
                }}
              />
              {/* NDVI value */}
              <div className="ml-2 text-sm">{item.value}</div>

              {/* Hover tooltip */}
              {hoveredIndex === index && (
                <div
                  className="absolute right-20 p-2 min-w-32 bg-gray-900 text-center text-white rounded-lg text-xs shadow-lg"
                  style={{ top: "-5px", transform: "translateY(-50%)" }}
                >
                  {item.label}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Coordinates;
