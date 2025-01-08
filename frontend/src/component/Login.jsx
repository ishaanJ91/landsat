import { Link, Navigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import axios from "axios";
import logo from "../images/logo.png";
import { UserContext } from "./UserContext";
import { jwtDecode } from "jwt-decode";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false);
  const { setUser } = useContext(UserContext);

  // Regular login handler
  async function handleLoginSubmit(ev) {
    ev.preventDefault();
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/login`,
        { email, password }
      );

      const { token, user } = data;
      handleSuccessfulLogin(token, user);
    } catch (e) {
      console.error("Login error:", e.response?.data || e.message);
      alert(
        "Login failed: " + (e.response?.data?.message || "Please try again")
      );
    }
  }

  // Google OAuth login success handler
  const handleGoogleLoginSuccess = async (response) => {
    try {
      const decoded = jwtDecode(response.credential);
      console.log("Decoded Google credentials:", {
        ...decoded,
        sub: decoded.sub?.slice(0, 5) + "...", // Log partial sub for debugging
      });

      const { email, name, picture, sub: googleId } = decoded;

      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/login-google`,
        {
          email,
          name,
          picture,
          googleId, // Send Google's unique identifier
        }
      );

      const { token, user } = data;
      handleSuccessfulLogin(token, user);
    } catch (e) {
      console.error("Google login error details:", {
        status: e.response?.status,
        data: e.response?.data,
        message: e.message,
      });
      alert(
        "Google login failed: " +
          (e.response?.data?.message || "Please try again")
      );
    }
  };

  // Common success handler
  const handleSuccessfulLogin = (token, user) => {
    localStorage.setItem("token", token);
    setUser(user);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setRedirect(true);
  };

  useEffect(() => {
    if (!window.google) {
      console.error("Google OAuth script not loaded");
      return;
    }

    google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleGoogleLoginSuccess,
    });

    const googleButton = document.getElementById("google-signin");
    if (googleButton) {
      google.accounts.id.renderButton(googleButton, {
        theme: "outline",
        size: "large",
        width: googleButton.offsetWidth,
      });
    }
  }, []);

  if (redirect) {
    return <Navigate to="/api/target-location" />;
  }

  return (
    <div className="overflow-x-hidden min-h-screen bg-black text-gray-100 flex items-center justify-center">
      <section className="top-0 bg-black z-30 relative">
        <div className="max-w-md mx-auto flex flex-col items-center justify-center">
          <div className="mb-6">
            <img src={logo} alt="Logo" className="h-40 w-40" />
          </div>

          <h2 className="text-2xl font-semibold mb-8">Login</h2>
          <form
            onSubmit={handleLoginSubmit}
            className="w-full flex flex-col gap-3"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="w-full py-3 px-4 bg-black border border-white text-white rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="w-full py-3 px-4 bg-black border border-white text-white rounded"
              required
            />

            <button
              type="submit"
              className="w-full mt-3 py-3 bg-gray-900 text-white font-semibold rounded hover:bg-gray-800 transition-colors"
            >
              Login
            </button>

            <div className="my-2 w-full border-t border-gray-700"></div>

            <div id="google-signin" className="w-full"></div>
          </form>

          <p className="text-gray-500 text-sm mt-6">
            By logging in, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-gray-400">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-gray-400">
              Data Processing Agreement
            </Link>
            .
          </p>

          <div className="mt-6 w-full border-t border-gray-700"></div>

          <p className="mt-4 text-gray-400 text-base font-bold">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-500 hover:underline">
              Register →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
