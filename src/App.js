import React, { useState } from 'react';

const App = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-x-hidden bg-black text-gray-100">
      <header className="py-4 md:py-6">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              <a href="#" title="" className="flex rounded outline-none focus:ring-1 focus:ring-gray-100 focus:ring-offset-2">
                <h1 className="text-2xl font-bold text-gray-100 font-pj">Landsat Tracker</h1>
              </a>
            </div>

            <div className="flex lg:hidden">
              <button type="button" className="text-gray-100" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
                {!expanded ? (
                  <span aria-hidden="true">
                    <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </span>
                ) : (
                  <span aria-hidden="true">
                    <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )}
              </button>
            </div>

            <div className="hidden lg:flex lg:ml-16 lg:items-center lg:justify-center lg:space-x-10 xl:space-x-16">
              <a href="#" title="" className="text-base font-medium text-gray-100 transition-all duration-200 rounded focus:outline-none font-pj hover:text-opacity-50 focus:ring-1 focus:ring-gray-100 focus:ring-offset-2"> Home </a>

              <a href="#" title="" className="text-base font-medium text-gray-100 transition-all duration-200 rounded focus:outline-none font-pj hover:text-opacity-50 focus:ring-1 focus:ring-gray-100 focus:ring-offset-2"> About </a>

              <a href="#" title="" className="text-base font-medium text-gray-100 transition-all duration-200 rounded focus:outline-none font-pj hover:text-opacity-50 focus:ring-1 focus:ring-gray-100 focus:ring-offset-2"> Data </a>
            </div>

            <div className="hidden lg:ml-auto lg:flex lg:items-center lg:space-x-10">
              <a href="#" title="" className="text-base font-medium text-gray-100 transition-all duration-200 rounded focus:outline-none font-pj hover:text-opacity-50 focus:ring-1 focus:ring-gray-100 focus:ring-offset-2"> Contact </a>

              <a
                href="#"
                title=""
                className="inline-flex items-center justify-center px-6 py-3 text-base font-bold leading-7 text-white transition-all duration-200 bg-gray-800 border border-transparent rounded-xl hover:bg-gray-700 font-pj focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-100"
                role="button"
              >
                Get Started
              </a>
            </div>
          </div>

          {/* Mobile Menu */}
          {expanded && (
            <nav>
              <div className="px-1 py-8">
                <div className="grid gap-y-7">
                  <a href="#" title="" className="flex items-center p-3 -m-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900 focus:outline-none font-pj focus:ring-1 focus:ring-gray-100 focus:ring-offset-2"> Home </a>

                  <a href="#" title="" className="flex items-center p-3 -m-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900 focus:outline-none font-pj focus:ring-1 focus:ring-gray-100 focus:ring-offset-2"> About </a>

                  <a href="#" title="" className="flex items-center p-3 -m-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900 focus:outline-none font-pj focus:ring-1 focus:ring-gray-100 focus:ring-offset-2"> Data </a>

                  <a href="#" title="" className="flex items-center p-3 -m-3 text-base font-medium text-gray-100 transition-all duration-200 rounded-xl hover:bg-gray-900 focus:outline-none font-pj focus:ring-1 focus:ring-gray-100 focus:ring-offset-2"> Contact </a>

                  <a
                    href="#"
                    title=""
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-bold leading-7 text-white transition-all duration-200 bg-gray-800 border border-transparent rounded-xl hover:bg-gray-700 font-pj focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-100"
                    role="button"
                  >
                    Get Started
                  </a>
                </div>
              </div>
            </nav>
          )}
        </div>
      </header>

      <section className="pt-12 bg-black sm:pt-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="px-6 text-lg text-gray-400 font-inter">Explore the Earth with Landsat Data</h1>
            <p className="mt-5 text-4xl font-bold leading-tight text-gray-100 sm:leading-tight sm:text-5xl lg:text-6xl lg:leading-tight font-pj">
              Discover insights from Landsat
              <span className="relative inline-flex sm:inline">
                  <span className="bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] blur-lg filter opacity-30 w-full h-full absolute inset-0"></span>
                  <span className="relative"> satellite </span>
              </span>
            </p>

            <div className="px-8 sm:items-center sm:justify-center sm:px-0 sm:space-x-5 sm:flex mt-9">
              <a
                href="#"
                title=""
                className="inline-flex items-center justify-center w-full px-8 py-3 text-lg font-bold text-white transition-all duration-200 bg-gray-800 border-2 border-transparent sm:w-auto rounded-xl font-pj hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-100"
                role="button"
              >
                Start Exploring
              </a>

              <a
                href="#"
                title=""
                className="inline-flex items-center justify-center w-full px-6 py-3 mt-4 text-lg font-bold text-gray-100 transition-all duration-200 border-2 border-gray-500 sm:w-auto sm:mt-0 rounded-xl font-pj focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-100 hover:bg-gray-800 focus:bg-gray-800 hover:text-white focus:text-white hover:border-gray-800 focus:border-gray-800"
                role="button"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 18 18" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8.18003 13.4261C6.8586 14.3918 5 13.448 5 11.8113V5.43865C5 3.80198 6.8586 2.85821 8.18003 3.82387L12.5403 7.01022C13.6336 7.80916 13.6336 9.44084 12.5403 10.2398L8.18003 13.4261Z"
                    stroke-width="2"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Watch Demo
              </a>
            </div>

            <p className="mt-8 text-base text-gray-400 font-inter">Access real-time satellite data · No subscription required</p>
          </div>
        </div>

        <div className="pb-12 bg-gray-900">
          <div className="relative">
            <div className="absolute inset-0 h-2/3 bg-black"></div>
            <div className="relative mx-auto">
              <div className="lg:max-w-6xl lg:mx-auto">
                <img className="transform scale-110" src="https://cdn.rareblocks.xyz/collection/clarity/images/hero/2/illustration.png" alt="Landsat Illustration" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
