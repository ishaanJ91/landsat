import React, {useState, useEffect} from "react";
import axios from "axios";

export default function SaveSidebar({ onClose, setInputLat, setInputLng, setIsExpanded }) {

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
    // Set the map coordinates to the selected location
    setInputLat(latitude);
    setInputLng(longitude);
    setIsExpanded(true); // Expand the sidebar if collapsed

    // Close the save sidebar
    onClose();
  };

  // Fetch saved locations when component mounts
  useEffect(() => {
    fetchSavedLocations();
  }, []);

  return (
    <>
    <div className="absolute left-8  bg-white top-2 overflow-y-auto">
      <div className="">
        {/* <button
          onClick={onClose} // Close the overlay when clicked
          className="text-red-500 mb-4 right-0"
        >
          Close
        </button> */}
        <h2 className="text-xl font-bold mb-4">Saved Locations </h2>

        <div className="grid grid-cols-1 space-y-4 w-80">
            {savedLocations.length > 0 ? (
              savedLocations.map((location, index) => (
                <div key={index} className="flex flex-row p-4 gap-4 bg-gray-100 rounded-lg">
                  <img className="w-24 h-24 rounded-lg" src={location.image} />

                  <div className="flex flex-col">
                    <h3 className="font-semibold text-xl">{location.locationName}</h3>
                    <p className="text-base"> {location.region}</p>

                    <div className="flex flex-col pt-3">

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
