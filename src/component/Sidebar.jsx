import React, { useState } from "react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-gray-900 ${
        isOpen ? "w-64" : "w-16"
      } transition-all duration-300`}
    >
      <button onClick={toggleSidebar} className="p-4 text-gray-100">
        {isOpen ? "Close" : "Open"}
      </button>
      <ul className={`${isOpen ? "block" : "hidden"} mt-4`}>
        <li className="p-4 hover:bg-gray-700">Dashboard</li>
        <li className="p-4 hover:bg-gray-700">Settings</li>
        <li className="p-4 hover:bg-gray-700">Profile</li>
        <li className="p-4 hover:bg-gray-700">Logout</li>
      </ul>
    </div>
  );
}
