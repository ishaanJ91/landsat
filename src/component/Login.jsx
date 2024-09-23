import { Link, Navigate } from "react-router-dom";
import { useContext, useState } from "react";
import axios from "axios";
import logo from "../images/logo.png";
import { UserContext } from "./UserContext.jsx";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false); // For redirection
  const { setUser } = useContext(UserContext); // Access setUser from UserContext
  const navigate = useNavigate();

  async function handleLoginSubmit(ev) {
    ev.preventDefault();
    try {
      const { data } = await axios.post("/login", { email, password });
      setUser(data);
      alert("Login successful");
      setRedirect(true);
    } catch (e) {
      alert("Login failed");
    }
  }

  if (redirect) {
    return <Navigate to="/dashboard" />; // Redirect to dashboard after login
  }

  return (
    <>
      <div className="overflow-x-hidden min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <section className="top-0 bg-black z-30 relative">
          <div className="max-w-md mx-auto flex flex-col items-center justify-center">
            <div className="mb-6">
              <img src={logo} className="h-40 w-40" />
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
                Login
              </button>

              <div className="my-2 w-full border-t border-gray-700"></div>

              <button
                type="button"
                className="w-full py-3 bg-white text-black font-semibold rounded"
                onClick={() => alert("Google OAuth not implemented yet")}
              >
                Login with Google
              </button>
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
              Dont have an account? &nbsp;
              <Link to="/register" className="text-indigo-500 hover:underline">
                Register &#x2192;
              </Link>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
