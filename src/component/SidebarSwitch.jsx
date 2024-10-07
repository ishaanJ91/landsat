import React, { useEffect, useState } from "react";
import Cloud from "./Cloud";
import SurfaceTemp from "./SurfaceTemp";
import axios from "axios";

export default function SidebarSwitcher({
  ndviGrid,
  addressComponents,
  inputLat,
  inputLng,
  overpassData,
  getNDVIColor,
  saveLocationData,
  downloadCSV,
  shareLocation,
  convertToDegrees,
}) {
  const [path, setPath] = useState("");
  const [row, setRow] = useState("");

  const formatDateTime = (dateString, timeString) => {
    const dateObj = new Date(dateString);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString("default", { month: "short" }); // Use short form for the month
    const year = dateObj.getFullYear();

    // Format time string
    const timeObj = new Date(`1970-01-01T${timeString}Z`); // Convert time to Date object for formatting
    const hours = timeObj.getUTCHours().toString().padStart(2, "0"); // Get hours in 24-hour format
    const minutes = timeObj.getUTCMinutes().toString().padStart(2, "0"); // Get minutes

    // Get the appropriate suffix for the day
    const daySuffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";

    return `${day}${daySuffix} ${month} ${year} at ${hours}:${minutes}`;
  };

  const getPathRowFromLatLng = async (latitude, longitude) => {
    try {
      const url = `https://nimbus.cr.usgs.gov/arcgis/rest/services/LLook_Outlines/MapServer/1/query?where=MODE=%27D%27&geometry=${longitude},${latitude}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json`;

      const response = await axios.get(url);

      if (
        response.data &&
        response.data.features &&
        response.data.features.length > 0
      ) {
        const { PATH, ROW } = response.data.features[0].attributes;
        return { path: PATH, row: ROW };
      } else {
        throw new Error("Failed to retrieve Path/Row for the given lat/lng.");
      }
    } catch (error) {
      console.error("Error fetching path/row from USGS API:", error);
      return null;
    }
  };

  useEffect(() => {
    if (inputLat && inputLng) {
      const fetchPathRow = async () => {
        const result = await getPathRowFromLatLng(inputLat, inputLng);
        if (result) {
          setPath(result.path); // Use setPath to update the path state
          setRow(result.row); // Use setRow to update the row state
        }
      };
      fetchPathRow();
    }
  }, [inputLat, inputLng, setPath, setRow]); // Include setPath and setRow as dependencies

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
                    <span className="text-xl text-black">
                      {pixel.ndvi.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No NDVI data available</p>
            )}
            <p className="py-3 pl-1 text-xs text-gray-800">
              *Each square above signifies 30x30 meters box at the location
              marked
            </p>
          </div>

          <div className="flex py-2 mt-2 flex-row items-end align-baseline">
            <div className="flex flex-col mb-2">
              <h2 className="text-2xl font-medium">
                {addressComponents.state || "Unavailable"}
              </h2>
              <h2 className="text-lg -mt-1 text-gray-700">
                {addressComponents.country}
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-6"
          >
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-6"
          >
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-6"
          >
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
          <div className="flex flex-col"></div>
          <div className="border-gray-300 text-base mb-8">
            {overpassData ? (
              <div className="flex flex-row justify-between items-center w-full">
                <h4 className="text-gray-800 font-medium">
                  Next Overpass Date{" "}
                </h4>
                <p className="text-right">
                  {" "}
                  {formatDateTime(overpassData.date, overpassData.time)}{" "}
                </p>
              </div>
            ) : (
              <p>No overpass found for the next few days.</p>
            )}

            <div className="flex text-base flex-row justify-between items-center w-full my-2">
              <span className=" text-gray-800 font-medium">Path, Row</span>
              {path}, {row}
            </div>

            <Cloud
              lat={inputLat}
              lon={inputLng}
              apiKey={"YOUR_API_KEY"} // Replace with your actual API key
            />
            <SurfaceTemp
              lat={inputLat}
              lon={inputLng}
              apiKey={"YOUR_API_KEY"} // Replace with your actual API key
            />
          </div>
        </div>
      </div>
    </>
  );
}
