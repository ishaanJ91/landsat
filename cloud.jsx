import React, { useState, useEffect } from 'react';

const Cloud = ({ lat, lon, apiKey }) => {
  const [cloudCoverage, setCloudCoverage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch cloud coverage data
    const fetchCloudCoverage = async () => {
      try {
        const response = await fetch(
          `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          // Extract cloud coverage percentage
          const cloudPercentage = data.clouds?.all || "No data";
          setCloudCoverage(cloudPercentage);
          console.log(`Cloud coverage at coordinates (${lat}, ${lon}): ${cloudPercentage}%`);
        } else {
          throw new Error(`Error fetching data: ${response.status} - ${response.statusText}`);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchCloudCoverage();
  }, [lat, lon, apiKey]); // Ensure the effect updates when props change

  return (
    <div>
      {error ? (
        <p>{error}</p>
      ) : cloudCoverage !== null ? (
        <p>Cloud coverage at coordinates ({lat}, {lon}): {cloudCoverage}%</p>
      ) : (
        <p>Loading cloud coverage data...</p>
      )}
    </div>
  );
};

export default Cloud;