import { createContext, useEffect, useState } from "react";
import axios from "axios";
import apiClient from "./utils/apiClient";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token"); // Retrieve token from storage
    if (token) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true, // Include cookies if needed
        })
        .then(({ data }) => {
          setUser(data);
          setReady(true);
        })
        .catch((err) => {
          console.error("Failed to fetch user profile:", err);
          setReady(true);
        });
    } else {
      console.error("No token found");
      setReady(true);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, ready }}>
      {children}
    </UserContext.Provider>
  );
}
