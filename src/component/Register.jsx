import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../images/logo.png";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Use jwt-decode to decode the token

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function handleRegisterSubmit(ev) {
    ev.preventDefault();
    axios
      .post("/register", {
        name,
        email,
        password,
      })
      .then(() => {
        alert(`Registration successful for ${name}`);
        setName("");
        setEmail("");
        setPassword("");
        navigate("/dashboard/target-location");
      })
      .catch((error) => {
        console.error("Error during registration:", error);
        alert("Registration failed");
      });
  }

  // Google OAuth registration success handler
  const handleGoogleRegisterSuccess = async (response) => {
    const decoded = jwtDecode(response.credential); // Decode the credential to extract information
    const { email, name } = decoded;

    try {
      await axios.post("/register-google", { email, name });
      alert(`Google registration successful for ${name}`);
      navigate("/dashboard");
    } catch (e) {
      console.error("Google register error:", e);
      alert("Google registration failed");
    }
  };

  useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      client_id:
        "981598769871-qi14dkp4jd9bcrqrp7u8jaknpf0tbp6f.apps.googleusercontent.com",
      callback: handleGoogleRegisterSuccess,
    });
    google.accounts.id.renderButton(document.getElementById("google-signin"), {
      theme: "outline",
      size: "large",
    });
  }, []);

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
              className="w-full py-3 px-4 bg-black border-1 border-white text-white rounded"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="w-full py-3 px-4 bg-black border-1 border-white text-white rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="w-full py-3 px-4 bg-black border-1 border-white text-white rounded"
              required
            />

            <button
              type="submit"
              className="w-full mt-3 py-3 bg-gray-900 text-white font-semibold rounded"
            >
              Sign Up
            </button>

            <div className="my-2 w-full border-t border-gray-700"></div>

            <div id="google-signin" className="w-full py-3 bg-white"></div>
          </form>

          <p className="text-gray-500 text-sm mt-6">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline">
              Data Processing Agreement
            </Link>
            .
          </p>

          <div className="mt-6 w-full border-t border-gray-700"></div>

          <p className="mt-4 text-gray-400 text-base font-bold">
            Already have an account? &nbsp;
            <Link to="/login" className="text-indigo-500 hover:underline">
              Login &#x2192;
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
