import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import axios from "axios";
import logo from "../images/logo.png";
import { UserContext } from "./UserContext"; // Import UserContext
import { jwtDecode } from "jwt-decode"; // Correct import for jwtDecode

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext); // Use UserContext here

  async function handleRegisterSubmit(ev) {
    ev.preventDefault();
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/register`,
        {
          name,
          email,
          password,
        }
      );

      const { token, user } = data;

      // Save token in localStorage
      localStorage.setItem("authToken", token);

      // Set user context
      setUser(user);

      // Set Axios defaults for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      alert(`Welcome ${name}! Your account has been created.`);
      navigate("/api/target-location");
    } catch (error) {
      console.error("Registration error:", error);
      alert(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    }
  }

  const handleGoogleRegisterSuccess = async (response) => {
    try {
      const decoded = jwtDecode(response.credential);
      const { email, name, picture, sub: googleId } = decoded;

      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/register-google`,
        {
          email,
          name,
          picture,
          googleId,
          authProvider: "google",
        }
      );

      const { token, user } = data;

      // Save token in localStorage
      localStorage.setItem("authToken", token);

      // Set user context
      setUser(user);

      // Set Axios defaults for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      alert(`Welcome ${name}!`);
      navigate("/api/target-location");
    } catch (error) {
      console.error("Google registration error:", error);
      alert(
        error.response?.data?.message ||
          "Google registration failed. Please try again."
      );
    }
  };

  useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleGoogleRegisterSuccess,
    });
    google.accounts.id.renderButton(document.getElementById("google-signin"), {
      theme: "outline",
      size: "large",
    });
  }, []);

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      navigate("/api/target-location");
    }
  }, [navigate]);

  return (
    <div className="overflow-x-hidden min-h-screen bg-black text-gray-100 flex items-center justify-center">
      <section className="top-0 bg-black z-30 relative">
        <div className="max-w-md mx-auto flex flex-col items-center justify-center">
          <div className="mb-6">
            <img src={logo} alt="Logo" className="h-40 w-40" />
          </div>

          <h2 className="text-2xl font-semibold mb-8">Create an account</h2>
          <form
            onSubmit={handleRegisterSubmit}
            className="w-full flex flex-col gap-3"
          >
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              className="w-full py-3 px-4 bg-black border border-white text-white rounded"
              required
            />
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
              Sign Up
            </button>

            <div className="my-2 w-full border-t border-gray-700"></div>

            <div id="google-signin" className="w-full"></div>
          </form>

          <p className="text-gray-500 text-sm mt-6">
            By signing up, you agree to our{" "}
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
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-500 hover:underline">
              Login →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
