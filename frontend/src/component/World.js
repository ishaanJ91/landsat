import React, { useEffect, useState, useRef } from "react";
import Globe from "react-globe.gl";
import * as turf from "@turf/turf";

const World = ({ userLocation }) => {
  const [countries, setCountries] = useState({ features: [] });
  const [hoverD, setHoverD] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const globeRef = useRef();

  const hardcodedDot = { latitude: 84.5, longitude: -4.006 };

  useEffect(() => {
    fetch("/datasets/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then(setCountries);
  }, []);

  useEffect(() => {
    if (globeRef.current && countries.features.length) {
      globeRef.current.controls().enableZoom = false;

      if (userLocation) {
        const { latitude, longitude } = userLocation;
        globeRef.current.pointOfView(
          { lat: latitude, lng: longitude, altitude: 3 },
          2000
        );
        const closestCountry = findClosestPolygon(userLocation, countries);
        if (closestCountry) {
          setTimeout(() => {
            setSelectedCountry(closestCountry);
            setDetailsVisible(true);
          }, 2000);
        }
      } else {
        const ireland = countries.features.find(
          (country) => country.properties.ISO_A2 === "IE"
        );
        if (ireland) {
          setSelectedCountry(ireland);
          setDetailsVisible(true);
        }
      }

      // Adjust the canvas size after the globe is rendered
      requestAnimationFrame(trimCanvas); // Use requestAnimationFrame for ensuring rendering is complete
    }
  }, [userLocation, countries]);

  const findClosestPolygon = (userLocation, countries) => {
    if (!countries.features.length) return null;

    let closestPolygon = null;
    let minDistance = Infinity;

    countries.features.forEach((country) => {
      const centroid = turf.centroid(country).geometry.coordinates;
      const distance = turf.distance(
        turf.point([userLocation.longitude, userLocation.latitude]),
        turf.point(centroid)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPolygon = country;
      }
    });

    return closestPolygon;
  };

  const trimCanvas = () => {
    const canvas = globeRef.current.renderer().domElement;
    if (!canvas) return; // Ensure canvas is available

    const context = canvas.getContext("2d");
    if (!context) return; // Ensure context is available

    const { width, height } = canvas;

    // Get the image data of the canvas
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    // Calculate the bounds of the non-transparent area
    const bounds = { top: height, left: width, right: 0, bottom: 0 };

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (pixels[(row * width + col) * 4 + 3] !== 0) {
          // Check alpha channel
          if (row < bounds.top) bounds.top = row;
          if (col < bounds.left) bounds.left = col;
          if (col > bounds.right) bounds.right = col;
          if (row > bounds.bottom) bounds.bottom = row;
        }
      }
    }

    const newWidth = bounds.right - bounds.left + 1;
    const newHeight = bounds.bottom - bounds.top + 1;

    // Create a trimmed canvas
    const trimmedCanvas = document.createElement("canvas");
    trimmedCanvas.width = newWidth;
    trimmedCanvas.height = newHeight;
    const trimmedContext = trimmedCanvas.getContext("2d");

    // Draw the trimmed portion of the canvas
    trimmedContext.drawImage(
      canvas,
      bounds.left,
      bounds.top,
      newWidth,
      newHeight,
      0,
      0,
      newWidth,
      newHeight
    );

    // Replace the original canvas with the trimmed one
    canvas.width = newWidth;
    canvas.height = newHeight;
    context.drawImage(trimmedCanvas, 0, 0);
  };

  // Function to determine the color based on NDVI values
  const getNDVIColor = (ndvi) => {
    if (ndvi < 0.1) return "orange"; // Indicates non-vegetated areas like urban, barren
    if (ndvi < 0.2) return "yellow"; // Sparse vegetation
    if (ndvi < 0.4) return "lightgreen"; // Moderate vegetation
    if (ndvi < 0.6) return "green"; // Dense vegetation
    return "darkgreen"; // Very dense vegetation
  };

  // NDVI calculation
  const getNDVIVal = (feat) => feat.properties.NDVI || 0; // Ensure the NDVI is fetched properly

  return (
    <div id="globeViz">
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="black"
        polygonsData={countries.features.filter(
          (d) => d.properties.ISO_A2 !== "AQ"
        )}
        polygonAltitude={(d) =>
          d === hoverD || d === selectedCountry ? 0.12 : 0.06
        }
        polygonCapColor={(d) => {
          const ndvi = getNDVIVal(d);
          return getNDVIColor(ndvi);
        }}
        polygonSideColor={() => "rgba(0, 100, 0, 0.15)"}
        polygonStrokeColor={() => "#111"}
        polygonLabel={({ properties: d }) => `
          <div style="font-size: 14px; color: #fff; background-color: rgba(0, 0, 0, 0.7); padding: 10px; border-radius: 8px;">
            <b style="font-size: 16px; color: #ffd700;">${d.ADMIN} (${d.ISO_A2})</b><br />
            <b style="font-size: 16px; color: #ffd700;"> NDVI: ${d.NDVI}</b><br />
          </div>
        `}
        onPolygonHover={setHoverD}
        onPolygonClick={(country) => {
          setSelectedCountry(country);
          setDetailsVisible(true);
        }}
        polygonsTransitionDuration={300}
        pointsData={[
          ...(userLocation
            ? [{ lat: userLocation.latitude, lng: userLocation.longitude }]
            : []),
          { lat: hardcodedDot.latitude, lng: hardcodedDot.longitude },
        ]}
        pointColor={() => "red"}
        pointAltitude={0.5}
        pointRadius={0.3}
      />
    </div>
  );
};

export default World;
