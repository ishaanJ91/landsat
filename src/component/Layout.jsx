import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  const location = useLocation();

  // Paths where you don't want to show the Header
  const hideHeaderOnPaths = [
    "/register",
    "/login",
    "/target-location",
    "/dashboard",
  ];

  return (
    <div className="">
      {!hideHeaderOnPaths.includes(location.pathname) && <Header />}
      <div className="">
        <Outlet />
      </div>
    </div>
  );
}
