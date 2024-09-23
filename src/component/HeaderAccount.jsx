import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "./UserContext";
import axios from "axios";
import { Navigate } from "react-router-dom";

export default function HeaderAccount() {
  const { user, setUser, ready } = useContext(UserContext);
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [redirect, setRedirect] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  async function logout() {
    try {
      await axios.post("/logout");
      setUser(null); // Clear user state
      setRedirect("/"); // Redirect to the homepage
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!ready) {
    return null;
  }

  if (!user && ready) {
    return <Navigate to="/" />; // Redirect to dashboard after login
  }

  return (
    <div className="overflow-x-hidden bg-black text-gray-100">
      <header
        className={`py-8 md:py-10 fixed top-0 w-full z-30 transition-all duration-300 ${
          scrolled
            ? "bg-black shadow-lg border-b-2 border-gray-900"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto px-14 flex justify-between items-center">
          <div className="flex-shrink-0">
            <a
              href="/dashboard"
              title="Landsat Tracker"
              className="flex rounded outline-none focus:ring-1 focus:ring-gray-100 focus:ring-offset-2"
            >
              <h1 className="text-2xl font-bold text-gray-100 font-pj">
                Landsat Tracker
              </h1>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:space-x-10 items-center">
            <Link
              to="/dashboard"
              title="Home"
              className="text-base font-medium text-gray-100 transition-all duration-200 hover:text-opacity-50"
            >
              Home
            </Link>
            <Link
              to="/dashboard/target-location"
              title="Data"
              className="text-base font-medium text-gray-100 transition-all duration-200 hover:text-opacity-50"
            >
              Data
            </Link>

            {/* User Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  className="text-base font-medium text-gray-100 transition-all duration-200 hover:text-opacity-50"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  {user.name}
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                    >
                      Dashboard
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200"
                      onClick={logout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
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
                <Link
                  to="#"
                  title="Home"
                  className="flex items-center p-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900"
                >
                  Home
                </Link>
                <Link
                  to="#"
                  title="About"
                  className="flex items-center p-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900"
                >
                  About
                </Link>
                <Link
                  to="/target-location"
                  title="Data"
                  className="flex items-center p-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900"
                >
                  Data
                </Link>
                <button className="inline-flex items-center justify-center px-6 py-3 text-base font-bold leading-7 text-white transition-all duration-200 bg-gray-800 border border-transparent rounded-xl hover:bg-gray-700">
                  Get Started
                </button>
              </div>
            </div>
          </nav>
        )}
      </header>
    </div>
  );
}
