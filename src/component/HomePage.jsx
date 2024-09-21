import React, { useState, useEffect } from "react";
import nasaLogo from "../images/nasa.png";
import earth from "../images/earth.png";
import maps from "../images/maps.webp";
import srmaps from "../images/sr_map.png";

export default function HomePage() {
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <div className={`overflow-x-hidden min-h-screen bg-black text-gray-100`}>
      <header
        className={`py-8 md:py-10 fixed top-0 w-full z-30 transition-all duration-300 ${
          scrolled
            ? "bg-black shadow-lg border-b-2 border-gray-900"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-5xl mx-auto px-10 flex justify-between items-center">
          <div className="flex-shrink-0">
            <a
              href="#"
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
            <a
              href="#"
              title="Home"
              className="text-base font-medium text-gray-100 transition-all duration-200 hover:text-opacity-50"
            >
              Home
            </a>
            <a
              href="#"
              title="About"
              className="text-base font-medium text-gray-100 transition-all duration-200 hover:text-opacity-50"
            >
              About
            </a>
            <a
              href="#"
              title="Data"
              className="text-base font-medium text-gray-100 transition-all duration-200 hover:text-opacity-50"
            >
              Data
            </a>
            <button
              type="button"
              className="text-base border-2 border-white py-1 px-4 rounded-lg font-medium text-gray-100 transition-all duration-200 hover:text-opacity-50"
            >
              Signup
            </button>
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
                <a
                  href="#"
                  title="Data"
                  className="flex items-center p-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900"
                >
                  Data
                </a>
                <a
                  href="#"
                  title="Contact"
                  className="flex items-center p-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900"
                >
                  Contact
                </a>
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

      <section className="mt-28 bg-black z-10 sm:pt-16 relative overflow-hidden">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-3 mx-auto text-left">
            <h1 className="text-xl text-gray-400 font-inter">
              Explore the Earth with Landsat Data
            </h1>
            <p className="mt-2 max-w-2xl text-5xl font-bold leading-tight text-gray-100 sm:leading-tight sm:text-5xl lg:text-6xl lg:leading-tight font-pj">
              Discover insights from Landsat
              <span className="relative inline-flex sm:inline">
                <span className="bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] blur-lg filter opacity-30 w-full h-full absolute inset-0"></span>
                <span className="relative"> Satellite </span>
              </span>
            </p>

            <div className="sm:items-center sm:justify-left sm:px-0 sm:space-x-5 sm:flex mt-8">
              <a
                href="#"
                title=""
                className="inline-flex items-center z-10 border-2 border-white justify-center w-full px-8 py-3 text-lg font-bold text-white transition-all duration-200 border-3 border-transparent sm:w-auto rounded-lg font-pj hover:text-black hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-50"
                role="button"
              >
                Get Started
              </a>
            </div>

            {/* Earth image container */}
            <div className="absolute -top-48 right-0 w-[140vw] overflow-hidden -z-1">
              <img src={earth} className="w-[200%] h-auto translate-x-[50%]" />
            </div>
          </div>

          <div className="flex flex-col py-6 my-20 px-3 text-gray-400">
            <p className="text-xl">
              Trusted by the world’s leading organizations ↘︎
            </p>

            <div className="flex flex-row gap-16">
              <img src={nasaLogo} className="size-28 opacity-60" />
              <img src={nasaLogo} className="size-28 opacity-60" />
              <img src={nasaLogo} className="size-28 opacity-60" />
              <img src={nasaLogo} className="size-28 opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* KEY FEATURES */}

      <section className="py-16 flex flex-col gap-16 bg-black sm:pt-16">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col justify-center">
            <h2 className="text-5xl font-bold text-white leading-tight">
              How does this work?
            </h2>

            <p className="mt-6 text-lg text-gray-700">
              Our project simplifies access to satellite data, making it easier
              for users to monitor and analyze critical information. By
              combining real-time insights and customizable data, we aim to
              empower informed decision-making with precision and ease.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col justify-center">
            <div className="mt-6 flex flex-col">
              <div className="grid grid-cols-2 md:grid-cols-2 sm:grid-cols-1">
                <div className="border-2 border-l-0 border-gray-600 pr-4 py-10">
                  <h3 className="text-2xl font-semibold text-white">
                    Real-Time Notifications
                  </h3>
                  <p className="text-lg text-gray-700">
                    Get instant alerts when the Landsat satellite passes over
                    your selected location, allowing you to monitor in
                    real-time.
                  </p>
                </div>

                <div className="pl-4 py-10 border-2 border-gray-600 border-l-0 border-r-0">
                  <h3 className="text-2xl font-semibold text-white">
                    Advanced Filtering Options
                  </h3>
                  <p className="text-lg text-gray-700">
                    Customize your satellite data view by filtering based on
                    cloud coverage, time intervals, and more, to ensure you get
                    the data that matters most.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-1 gap-4">
                <div className="border-b-2 py-10 border-gray-600 pr-4">
                  <div className="flex flex-row gap-4">
                    <h3 className="text-2xl font-semibold text-white">
                      Target Location Selection
                    </h3>
                    <p className="text-lg text-gray-700">
                      Easily define and update your target location to receive
                      notifications and view relevant satellite data.
                    </p>
                  </div>
                  <img src={maps} className="w-full h-auto mt-8" />
                </div>

                <div className="pl-4 py-10">
                  <div className="flex flex-row gap-4">
                    <h3 className="text-2xl font-semibold text-white">
                      Surface Reflectance (SR) Data
                    </h3>
                    <p className="text-lg text-gray-700">
                      Access high-quality Surface Reflectance data that enhances
                      your analysis and decision-making process.
                    </p>
                  </div>
                  <img src={srmaps} className="w-full h-auto mt-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-16 container flex flex-col sm:flex-row mx-auto px-6 lg:px-8 justify-between">
          <h2 className="text-5xl font-bold text-white leading-tight">
            Get Started <br /> Now
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-2 sm:grid-cols-1 justify-center items-end gap-5">
            <button
              type="button"
              className="w-full md:w-auto text-lg border-2 border-white py-2 px-5 rounded-lg font-medium text-gray-100 transition-all duration-200 hover:text-black hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-50"
            >
              Create an Account
            </button>
            <button
              type="button"
              className="w-full md:w-auto text-lg border-2 border-white py-2 px-5 rounded-lg font-medium text-gray-100 transition-all duration-200  hover:text-black hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-50"
            >
              Login
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
