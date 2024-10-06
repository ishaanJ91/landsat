import React, { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import axios from "axios";
import { Line } from "react-chartjs-2";
import Loader from "./Loader";
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns"; // Import the date adapter for the time scale
import Chart from "./Chart"; // Import the Chart component

// Register necessary components for Chart.js
ChartJS.register(
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // Register TimeScale
);

export default function History({
  latitude,
  longitude,
  addressComponents,
  onClose,
}) {
  // Initialize startDate and endDate as dayjs objects
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [ndviData, setNdviData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // State for controlling the loader

  // Function to fetch NDVI data
  const fetchNDVIData = async () => {
    console.log("Fetching NDVI data...");
    try {
      const response = await axios.get("/ndvi-images", {
        params: {
          latitude,
          longitude,
          startDate: startDate.format("YYYY-MM-DD"),
          endDate: endDate.format("YYYY-MM-DD"),
        },
      });
      setNdviData(response.data.ndviImages); // Save fetched NDVI data
    } catch (err) {
      setError("Error fetching NDVI data");
    }
  };

  // Prepare data for the graph
  const chartData = {
    labels: ndviData.map((item) => item.date), // X-axis: Dates
    datasets: [
      {
        label: "NDVI Value",
        data: ndviData.map((item) => item.ndviValue), // Y-axis: NDVI values
        borderColor: "rgba(75, 192, 192, 1)", // Color of the line
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 1.3,
        pointHoverRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        enabled: true,
        caretPadding: 10,
        yAlign: "top",
        backgroundColor: "#000",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#000",
        borderWidth: 0.5,
        titleAlign: "center",
        bodyAlign: "center",
        titleFont: {
          size: 13,
          weight: 700,
          color: "#3b567f",
          family: "Nunito, sans-serif",
        },
        bodyFont: {
          size: 9,
          weight: "normal",
          color: "#000",
          family: "Nunito, sans-serif",
        },
        callbacks: {
          label: () => "", // Hide the label text
          title: (context) => `NDVI Value: ${context[0].raw.toFixed(2)}`, // Display the NDVI value as title
          beforeBody: (context) => {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            });
          },
        },
        displayColors: false, // Remove the color square in tooltip
      },
      legend: {
        display: false, // Hide the legend
      },
    },
    scales: {
      x: {
        type: "time", // Set the x-axis to be a time scale
        title: {
          display: true,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        title: {
          display: true,
          text: "NDVI",
        },
        suggestedMin: 0, // Minimum value for NDVI
        suggestedMax: 1, // Maximum value for NDVI
      },
    },
  };

  const countryName = addressComponents?.country || "Unavailable";
  const region = addressComponents?.state || "Unavailable";

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="px-6 mt-4 overflow-y-hidden">
          <div className="relative h-full w-full">
            <button
              onClick={onClose} // Use the onClose prop to close the pop-up
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              ✕ {/* Close button symbol or use an SVG */}
            </button>
          </div>
          <h2 className="text-3xl font-semibold">NDVI History</h2>
          <p className="text-lg text-gray-800 -mt-1">
            {countryName}, {region}
          </p>

          {/* Replace the input labels with DatePicker */}
          <div className="flex flex-row gap-4 my-8">
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              renderInput={(params) => <input {...params} />}
              sx={{
                width: "13rem",
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              renderInput={(params) => <input {...params} />}
            />

            <button
              onClick={fetchNDVIData}
              className="px-4 py-2 bg-black text-white rounded-md"
            >
              GET NDVI DATA
            </button>
          </div>

          {/* Render the graph */}
          {loading ? (
            <Loader />
          ) : (
            <div style={{ width: "80%" }}>
              <Line data={chartData} options={options} />
            </div>
          )}
        </div>
      </LocalizationProvider>

      <Chart className="mb-8" latitude={latitude} longitude={longitude} />

      <div className="mb-8"></div>
    </>
  );
}
