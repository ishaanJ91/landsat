import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "./UserContext";
import Sidebar from "./Sidebar";
import HeaderAccount from "./HeaderAccount";
import { Navigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useContext(UserContext);
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
    <div className="overflow-x-hidden min-h-screen bg-black text-gray-100">
      <HeaderAccount scrolled={scrolled} />

      <section className="mt-28 bg-black z-10 sm:pt-16 relative overflow-hidden">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-3 mx-auto text-left">
            <p className="mt-2 max-w-2xl text-5xl font-bold leading-tight text-gray-100 sm:leading-tight sm:text-5xl lg:text-6xl lg:leading-tight font-pj">
              Welcome <br />
              <span className="relative inline-flex sm:inline">
                <span className="bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] blur-lg filter opacity-30 w-full h-full absolute inset-0"></span>
                <span className="relative"> {user?.name} </span>
              </span>
            </p>

            <div className="sm:items-center sm:justify-left sm:px-0 sm:space-x-5 sm:flex mt-8"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
