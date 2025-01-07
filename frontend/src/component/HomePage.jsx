import React, { useState, useEffect } from "react";
import nasaLogo from "../images/nasa.png";
import asi from "../images/asi.png";
import isro from "../images/isro.png";
import nasa from "../images/nasa.webp";
import jaxa from "../images/jaxa.png";
import earth from "../images/earth.png";
import maps from "../images/maps.webp";
import srmaps from "../images/sr_map.png";
import { Link } from "react-router-dom";
import Header from "./Header";
import World from "./World";

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
      <Header
        scrolled={scrolled}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      <section className="mt-28 bg-black z-10 sm:pt-16 relative overflow-hidden">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-3 mx-auto ml-0 text-left max-w-fit">
            <h1 className="text-xl z-50 text-gray-400 w-fit font-inter">
              Challenge Name
            </h1>
            <p className="mt-2 z-50 max-w-2xl text-5xl font-bold leading-tight text-gray-100 sm:leading-tight sm:text-5xl lg:text-6xl lg:leading-tight font-pj">
              Landsat Reflectance Data: On the Fly and at Your Fingertips
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
          </div>

          <div className="absolute -top-20 left-96 w-[140vw] -z-10 overflow-hidden -z-1">
            {/* <img src={earth} className="w-[200%] h-auto translate-x-[50%]" /> */}
            <World />
          </div>

          <div className="flex flex-col py-6 my-20 px-3 text-gray-400">
            <p className="text-xl">
              Trusted by the world’s leading organizations ↘︎
            </p>

            <div className="flex flex-row mt-6 gap-16">
              <img src={nasaLogo} className="size-28 " />
              <img src={isro} className="grayscale size-28 " />
              <img src={jaxa} className="grayscale size-28 " />
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
                <div className="flex flex-col lg:flex-col md:flex-col sm:flex-row gap-2 border-2 border-l-0 border-gray-900 pr-8 py-16">
                  <h3 className="text-2xl font-semibold text-white">
                    Real-Time Notifications
                  </h3>
                  <p className="text-lg text-gray-700">
                    Get instant alerts when the Landsat satellite passes over
                    your selected location, allowing you to monitor in
                    real-time.
                  </p>
                </div>

                <div className="flex flex-col lg:flex-col md:flex-col sm:flex-row gap-2 pl-8 py-16 border-2 border-gray-900 border-l-0 border-r-0">
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
                <div className="border-b-2 py-10 border-gray-900 pr-4">
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
            <Link
              to="/register"
              type="button"
              className="w-full md:w-auto text-lg border-2 border-white py-2 px-5 rounded-lg font-medium text-gray-100 transition-all duration-200 hover:text-black hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-50"
            >
              Create an Account
            </Link>
            <Link
              to="/login"
              type="button"
              className="w-full text-center md:w-auto text-lg border-2 border-white py-2 px-5 rounded-lg font-medium text-gray-100 transition-all duration-200  hover:text-black hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-50"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
