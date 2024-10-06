import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../images/logo.png";

export default function Header() {
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState(""); // Store the user's name
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();

  // Check if the user is logged in on initial render
  useEffect(() => {
    const token = localStorage.getItem("token"); // Retrieve token
    const storedUserName = localStorage.getItem("userName"); // Retrieve user name from localStorage

    if (token && storedUserName) {
      setIsLoggedIn(true);
      setUserName(storedUserName); // Set the user's name if available
    }
  }, []);

  // Scroll listener for header background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Redirect logged-in user to dashboard on home route
  useEffect(() => {
    if (isLoggedIn && window.location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <>
      <div className="overflow-x-hidden bg-black text-gray-100">
        <header
          className={`py-8 md:py-10 fixed top-0 w-full z-30 transition-all duration-300 ${
            scrolled
              ? "bg-black shadow-lg border-b-2 border-gray-900"
              : "bg-transparent"
          }`}
        >
          <div className="mx-auto px-20 flex justify-between items-center">
            <div className="flex items-center">
              <a
                href="/"
                title="Landsat Tracker"
                className="flex items-center rounded outline-none focus:ring-1 focus:ring-gray-100 focus:ring-offset-2"
              >
                <img
                  src={logo}
                  alt="LandStat Logo"
                  className="w-12 h-12 mr-6"
                />
                <h1 className="text-4xl font-bold text-gray-100 font-pj">
                  LandStat
                </h1>
              </a>
            </div>

            {/* Desktop Navigation */}
            {/* Conditionally Render Signup or Profile with User's Name */}
            <div className="hidden lg:flex gap-5 items-center">
              <Link
                to="/register"
                type="button"
                className="text-base border-2 border-white py-1 px-4 rounded-lg font-medium text-gray-100 transition-all duration-200 hover:text-opacity-50"
              >
                Signup
              </Link>

              <Link
                to="/login"
                type="button"
                className="text-base border-2 border-white py-1 px-4 rounded-lg font-medium text-gray-100 transition-all duration-200 hover:text-opacity-50"
              >
                Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                type="button"
                className="text-gray-100"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
              >
                {!expanded ? (
                  <svg
                    className="w-7 h-7"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-7 h-7"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {expanded && (
            <nav className="lg:hidden">
              <div className="px-1 py-8">
                <div className="grid gap-y-7">
                  <a
                    href="#"
                    title="Home"
                    className="flex items-center p-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900"
                  >
                    Home
                  </a>
                  <a
                    href="#"
                    title="About"
                    className="flex items-center p-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900"
                  >
                    About
                  </a>
                  <Link
                    to="/target-location"
                    title="Data"
                    className="flex items-center p-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900"
                  >
                    Data
                  </Link>
                  <a
                    href="#"
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-bold leading-7 text-white transition-all duration-200 bg-gray-800 border border-transparent rounded-xl hover:bg-gray-700"
                    role="button"
                  >
                    Get Started
                  </a>
                </div>
              </div>
            </nav>
          )}
        </header>
      </div>
    </>
  );
}
