import React from "react";
import HomePage from "./component/HomePage";
import Register from "./component/Register";
import Login from "./component/Login";
import TargetLocation from "./component/TargetLocation";

import { Route, Routes } from "react-router-dom";
import { Link } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { UserContextProvider } from "./component/UserContext";

axios.defaults.baseURL = process.env.REACT_APP_API_URL;
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or however you store your token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  return (
    <UserContextProvider>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/api/target-location" element={<TargetLocation />} />
      </Routes>
    </UserContextProvider>
  );
}

export default App;
