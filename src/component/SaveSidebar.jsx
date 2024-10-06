import React, { useState, useEffect } from "react";
import axios from "axios";

export default function SaveSidebar({ onClose }) {
  const [savedLocations, setSavedLocations] = useState([]);

  // Function to fetch saved locations
  const fetchSavedLocations = async () => {
    try {
      const response = await axios.get("/saved-locations");
      setSavedLocations(response.data);
    } catch (error) {
      console.error("Error fetching saved locations:", error);
    }
  };
  
  useEffect(() => {
    fetchSavedLocations();
  }, []);

  // Function to handle deleting a saved location
  const handleUnsave = async (id) => {
    try {
      await axios.delete(`/unsave-location/${id}`);
      // Refresh the list of saved locations after deleting
      fetchSavedLocations();
    } catch (error) {
      console.error("Error unsaving location:", error);
    }
  };

  // Function to handle viewing details of a location
  const handleViewDetails = (latitude, longitude) => {
    // Redirect to the target location URL with the given latitude and longitude
    window.location.href = `http://localhost:3000/dashboard/target-location?lat=${latitude}&lng=${longitude}&zoom=10`;
  };

  return (
    <>
      <div className="absolute left-0 bg-white top-0 -z-10 overflow-y-auto w-96 p-4">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          >
            ✕ {/* You can replace this with an SVG icon if preferred */}
          </button>
          
          <h2 className="text-xl font-bold mb-4">Saved Locations</h2>

          <div className="grid grid-cols-1 space-y-4">
            {savedLocations.length > 0 ? (
              savedLocations.map((location, index) => (
                <div key={index} className="flex flex-row p-4 gap-4 bg-gray-100 rounded-lg">
                  <img className="w-24 h-24 rounded-lg" src={location.image} alt="Location Thumbnail" />

                  <div className="flex flex-col flex-grow">
                    <h3 className="font-semibold text-xl">{location.locationName}</h3>
                    <p className="text-base -mt-1">{location.region}</p>

                    <div className="flex flex-row pt-5 space-x-2">
                      {/* View Button */}
                      <button
                        onClick={() => handleViewDetails(location.coordinates.latitude, location.coordinates.longitude)}
                        className="px-6 py-1 text-xs text-black border-1 border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white"
                      >
                        View
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => handleUnsave(location._id)}
                        className="px-6 py-1 text-xs  text-white bg-red-500 rounded-lg hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No saved locations found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
