# LandStat - NASA Space Apps Challenge Athlone 2024

LandStat is an interactive web application designed to provide users with vegetation data through NDVI (Normalized Difference Vegetation Index) visualizations. Built using the MERN stack (MongoDB, Express.js, React.js, Node.js), the application allows users to select any global location via an interactive map or input coordinates to view NDVI data, which is essential for understanding vegetation density, health, and environmental insights.

## 📑 Table of Contents

- 📃 [Overview](#overview)
- 🔗 [Core Technologies & APIs](#core-technologies--apis)
- 🌟 [Key Features](#key-features)
- 💻 [How to Use](#how-to-use)
- 📷 [Preview](#preview)
- 🚀 [Planned Enhancements](#planned-enhancements)
- 🤝 [Contributing to LandStat](#contributing-to-landstat)
- 📄 [License](#license)

---

## 📃 Overview

LandStat leverages the power of Google Maps and Earth Engine APIs to create a user-friendly platform for analyzing vegetation data. With a fully functional search bar, users can pinpoint locations on the map or manually enter latitude and longitude. Once a location is selected, the application dynamically fetches NDVI data, which is visualized both on the map and within a sidebar that details NDVI values in a 3x3 grid. Secure authentication is provided through Google OAuth, enabling users to save, download, and share their findings seamlessly.

## 🔗 Core Technologies & APIs

LandStat's functionalities are powered by a combination of APIs and technologies, designed to provide a seamless experience:

### 1. **Google Maps API**

- **Functionality**: Provides an interactive map interface where users can search, explore, and click on any location.
- **Integration**: Includes geolocation-based searches and click-to-fetch NDVI data functionality.
- **Features**: The map is rendered with customizable markers, user inputs, and geocoding services.

### 2. **Google Earth Engine API**

- **Functionality**: Retrieves NDVI data for any selected location worldwide.
- **Visualization**: NDVI values are displayed on a 90x90 meter section of the map, providing detailed insights into vegetation density and condition.

### 3. **Google OAuth 2.0 Authentication**

- **Functionality**: Securely manages user authentication for logging in and signing up.
- **Features**: Uses Google OAuth to ensure a streamlined and secure login experience, allowing users to access their personalized features within the application.

### 4. **MongoDB Database**

- **Functionality**: Serves as the primary database for storing user data, including saved NDVI visualizations and metadata.
- **Integration**: Works seamlessly with Mongoose for structured data modeling and rapid retrieval of user-specific content.

## 🌟 Key Features

- **Interactive NDVI Map Visualization**:
  - Click anywhere on the map to display a 90x90 meter NDVI grid, visually coded to represent vegetation health and density.
  - An additional 3x3 pixel grid representation is shown in the sidebar, providing a more granular view of the NDVI values at the selected location.
- **Geolocation-Based Search & Coordinate Input**:
  - Use the search bar to find locations by name, or manually input latitude and longitude coordinates to view NDVI data for any specific region.
- **Secure User Authentication with Google OAuth**:
  - A secure and quick login/signup process using Google accounts.
  - Authenticated users have access to enhanced features such as saving and sharing NDVI data visualizations.
- **Save, Download, & Share**:

  - Once NDVI data is fetched and visualized, users can save their data for later review, download images of the visualizations, or share them through easily accessible options.

- **Real-Time Metadata & Overpass Information**:

  - Displays real-time metadata about the selected location, including coordinates and the next satellite overpass date and time, enhancing the user’s ability to plan for updated NDVI data.

- **Detailed Sidebar Analysis**:
  - A sidebar presents a breakdown of NDVI values, as well as additional data such as charts and visual analytics for in-depth vegetation analysis.

## 💻 How to Use

- **Search for Locations**: Use the integrated search bar to find locations by name. Alternatively, input latitude and longitude to zoom directly to a specific area.
- **Click & Explore**: Click on any location on the map to fetch and view its NDVI data, rendered in real-time. The map displays a 90x90 meter NDVI visualization while the sidebar provides a 3x3 pixel breakdown for detailed analysis.
- **Utilize Metadata**: View the exact coordinates of the selected point and the next satellite overpass details to stay updated on data availability.
- **Save & Share Insights**: Use the "Save", "Download", and "Share" features to retain or distribute visualizations of the NDVI data for future analysis or sharing with peers.

## 📷 Preview

[Selecting Location](./videos/LandStat1.mov)<br>
[Download and Share Feature](./videos/LandStat2.mov)<br>
[Graph and Past Data](./videos/LandStat3.mov)

## 🚀 Planned Enhancements

- **Extended Satellite Data Integration**: Plan to integrate additional satellite data sources to expand the range and accuracy of vegetation health analysis.
- **User-Specific Data Personalization**: Improved data management in MongoDB to allow personalized storage and retrieval of user-specific content, enabling more tailored insights.
- **Enhanced UI/UX**: Continuous improvements in the user interface for better map interactions, visual data representations, and easier navigation throughout the application.

## 🤝 Contributing to LandStat

Contributions are welcome! If you'd like to improve the project, please:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add feature'`).
4. Push the branch (`git push origin feature-branch`).
5. Submit a pull request.

Your contributions will help us make LandStat better!

## 📄 License

This project is licensed under the MIT License, permitting anyone to freely use, modify, and distribute the code.

---

Thank you for checking out LandStat! We are excited to see the community's feedback and contributions to this initiative for analyzing and understanding global vegetation health. 🌍🌱🚀
