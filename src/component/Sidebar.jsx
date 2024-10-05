import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../images/logo.png";
import SaveSidebar from "./SaveSidebar"; // Import the SaveSidebar component

export default function Sidebar() {
  const [isSaveOpen, setIsSaveOpen] = useState(false);

  // Function to open the save sidebar
  const handleSaveClick = () => {
    setIsSaveOpen(true); // Open the Save overlay
  };

  // Function to close the save sidebar
  const closeSaveOverlay = () => {
    setIsSaveOpen(false); // Close the Save overlay
  };

  return (
    <>
      {/* Sidebar */}
      

      {/* Conditionally render the SaveSidebar overlay */}
      {/* {isSaveOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center">
            <SaveSidebar onClose={closeSaveOverlay} />
        </div>
      )} */}
    </>
  );
}
