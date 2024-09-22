import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Dashboard() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    axios
      .get("/profile", { withCredentials: true }) // Ensure backend is running on correct port
      .then((response) => {
        setUsername(response.data.name); // Set the username from the response
      })
      .catch((error) => {
        console.error("Error fetching profile data:", error);
      });
  }, []);

  return (
    <>
      <div className="overflow-x-hidden min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <section className="top-0 bg-black z-30 relative">
          <div className="max-w-md mx-auto flex flex-col items-center justify-center">
            <h2 className="text-5xl font-semibold mb-8">
              Welcome Back, {username}
            </h2>
          </div>
        </section>
      </div>
    </>
  );
}
