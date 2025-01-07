import axios from "axios";
axios.defaults.withCredentials = true; // Include cookies/credentials for cross-origin requests

const apiClient = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL || "https://landstat-backend.vercel.app", // Fallback to default URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies/credentials for cross-origin requests
});

export default apiClient;
