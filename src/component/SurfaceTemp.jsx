// SurfaceTemp.js
import React, { useState, useEffect } from 'react';

const SurfaceTemp = ({ lat, lon, apiKey }) => {
  const [surfaceTemp, setSurfaceTemp] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch surface temperature data
    const fetchSurfaceTemp = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          // Extract temperature in Kelvin and convert to Celsius
          const tempKelvin = data.main?.temp;

          if (tempKelvin != null) {
            const tempCelsius = tempKelvin - 273.15;
            setSurfaceTemp(tempCelsius.toFixed(2)); // Round to 2 decimal places
            console.log(
              `Surface temperature at coordinates (${lat}, ${lon}): ${tempCelsius}°C`
            );
          } else {
            setError('Temperature data not available');
          }
        } else {
          throw new Error(
            `Error fetching data: ${response.status} - ${response.statusText}`
          );
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchSurfaceTemp();
  }, [lat, lon, apiKey]); // Ensure the effect updates when props change

  return (
    <div>
      {error ? (
        <p>{error}</p>
      ) : surfaceTemp !== null ? (
        <p>
          Surface temperature {surfaceTemp}°C
        </p>
      ) : (
        <p>Loading surface temperature data...</p>
      )}
    </div>
  );
};

export default SurfaceTemp;