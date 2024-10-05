// SidebarSwitcher.jsx
import React from "react";
import Cloud from "./Cloud";
import SurfaceTemp from "./SurfaceTemp";

export default function SidebarSwitcher({
  ndviGrid,
  addressComponents,
  inputLat,
  inputLng,
  path,
  row,
  overpassData,
  getNDVIColor,
  saveLocationData,
  downloadCSV,
  shareLocation,
  convertToDegrees,
}) {

  return (
    <>
      {/* Location Details (Mock Section for Google-like Sidebar) */}
      <div className="border-b pb-4">
        <div className="px-4 mt-6 flex flex-col">
          <div className="">
            {ndviGrid ? (
              <div className="grid grid-cols-3 border-solid border-gray-500">
                {ndviGrid.map((pixel, index) => (
                  <div
                    key={index}
                    className="w-full h-28 flex items-center justify-center border-1 border-gray-200"
                    style={{
                      backgroundColor: getNDVIColor(pixel.ndvi),
                    }}
                  >
                    <span className="text-xs text-black">
                      {pixel.ndvi.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No NDVI data available</p>
            )}
            <p className="py-3 pl-1 text-xs text-gray-800">
              *Each square above signifies 30x30 meters box at the location marked
            </p>
          </div>

            <div className="flex py-2 mt-2 flex-row items-end align-baseline">
              <div className="flex flex-col mb-2">
                <h2 className="text-2xl font-medium">
                  {addressComponents?.state || "Unavailable"}
                </h2>
                <h2 className="text-lg -mt-1 text-gray-700">
                  {addressComponents?.country}
                </h2>
              </div>
              <div className="flex flex-col ml-auto mb-2 text-right pb-1">
                <span className="text-sm text-gray-800">
                  {convertToDegrees(inputLat, "lat")}
                </span>
                <span className="text-sm text-gray-800">
                  {convertToDegrees(inputLng, "lng")}
                </span>
              </div>
            </div>
        </div>
      </div>  

      {/* Action Buttons */}
      <div className="p-4 flex justify-around border-b border-gray-200">
        <button
          onClick={saveLocationData}
          className="flex flex-col items-center text-gray-800 hover:text-black"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path
              fillRule="evenodd"
              d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs pt-1"> Save </span>
        </button>
        <button
          onClick={downloadCSV}
          className="flex flex-col items-center text-gray-800 hover:text-black"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path
              fillRule="evenodd"
              d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs pt-1"> Download </span>
        </button>
        <button
          onClick={shareLocation}
          className="flex flex-col items-center text-gray-800 hover:text-black"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path
              fillRule="evenodd"
              d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs pt-1"> Share </span>
        </button>
      </div>

      <div className="px-4 mt-2 pt-4">
        <h2 className="text-2xl mb-4 font-medium">Meta Data</h2>
        <div className="flex flex-col mb-4">
          <div className="flex flex-row gap-4">
            <div className="flex text-lg flex-row gap-2">
              <span className=" text-gray-800 font-medium">
                Path
              </span>
              {path}
            </div>
            |{" "}
            <div className="flex text-lg flex-row mb-2 gap-2">
              <span className="text-gray-800 font-medium">
                Row
              </span>
              {row}
            </div>
          </div>
          <div className="border-gray-300 text-lg">
            {overpassData ? (
              <div className="flex flex-col">
                <h4 className="text-gray-800 font-medium">Upcoming Overpass Date</h4>
                <p className="">{overpassData?.date} {overpassData?.time}</p>
              </div>
            ) : (
              <p>No overpass found for the next few days.</p>
            )}
          </div>

          <div className="">
            <Cloud lat={inputLat} lon={inputLng} apiKey={"5576ca2996ff7133deae5519f72b8963"} />     
            <SurfaceTemp
              lat={inputLat}
              lon={inputLng}
              apiKey={"5576ca2996ff7133deae5519f72b8963"} // Replace with your actual API key
            />

          </div>
        </div>
      </div>
    </>
  );
}
