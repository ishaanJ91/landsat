import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  CategoryScale,
} from "chart.js";

// Register necessary components for Chart.js
ChartJS.register(
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
  Tooltip
);

export default function Chart({ latitude, longitude }) {
  const [seasonalData, setSeasonalData] = useState([]);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  // Fetch NDVI data for different seasons from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/earth-engine-seasonal-ndvi",
          {
            params: {
              latitude,
              longitude,
            },
          }
        );
        const { seasonalResults } = response.data;

        // Map the seasonal NDVI data
        const formattedData = seasonalResults.map((result) => ({
          season: result.season, // 'Spring', 'Summer', etc.
          ndvi: result.ndvi,
        }));

        setSeasonalData(formattedData);
      } catch (error) {
        console.error("Error fetching NDVI data:", error);
        setError("Failed to fetch data.");
      }
    };

    if (latitude && longitude) {
      fetchData();
    }
  }, [latitude, longitude]);

  // Prepare data for Chart.js
  const data = {
    labels: seasonalData.map((point) => point.season), // X-axis as seasons
    datasets: [
      {
        label: "NDVI by Season",
        data: seasonalData.map((point) => point.ndvi), // Y-axis as NDVI values
        borderColor: "rgba(75, 192, 192, 1)", // Green color for NDVI line
        borderWidth: 3,
        tension: 0.5, // Smoothing the curve
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: false, // No fill under the line
      },
    ],
  };

  // Chart.js options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "black",
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => `NDVI: ${context.raw.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Season",
          font: {
            size: 14,
            weight: "bold",
          },
          color: "black",
        },
        ticks: {
          color: "black",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "NDVI",
          font: {
            size: 14,
            weight: "bold",
          },
          color: "black",
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "black",
        },
      },
    },
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (!seasonalData.length) {
    return <div>Loading data...</div>;
  }

  return (
    <div
      className="chart-container"
      style={{
        width: "90%",
        margin: "auto",
        background: "#f4f4f4",
        padding: "20px",
        borderRadius: "10px",
      }}
    >
      <h2 style={{ textAlign: "center" }}>NDVI Seasonal Comparison</h2>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
