"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // 👈 Add this
import Header from "../components/Header";
import Logo from "../components/Logo";

// Response from /token/
interface LoginResponse {
  access: string;
  refresh: string;
}

// Data we want to save from decoded token
interface UserData {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_superuser?: boolean;
  groups?: string[];
}

const Login = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // Get the 'next' parameter from the URL
  const next = searchParams.get("next") || "/"; // Default to '/' if no 'next' query param is found

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post<LoginResponse>(`${API_BASE_URL}/token/`, {
        username,
        password,
      });

      // Save tokens
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // Decode access token
      const decoded: any = jwtDecode(data.access);

      const userData: UserData = {
        username: decoded.username,
        email: decoded.email,
        first_name: decoded.first_name,
        last_name: decoded.last_name,
        is_superuser: decoded.is_superuser,
        groups: decoded.groups,
      };

      // Save userData
      localStorage.setItem("userData", JSON.stringify(userData));

      // Redirect to the 'next' page or homepage
      router.push(next); // Redirect to the 'next' URL (or '/' if not provided)
    } catch (err) {
      console.error(err);
      setError("Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-teal-100">
      <Header>
        <Logo />
      </Header>

      <div className="flex flex-1 justify-center items-center">
        {loading ? (
          <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center animate-pulse">
            <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">Logging you in...</p>
          </div>
        ) : (
          <div className="p-8 rounded-lg shadow-xl bg-white max-w-md w-full">
            <h1 className="text-center mb-6 text-3xl font-bold text-gray-800">
              Welcome Back
            </h1>
            <p className="text-center text-gray-500 mb-4">
              Please login to your account
            </p>

            {error && (
              <p className="text-red-500 text-center mb-4 font-medium">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                autoComplete="current-password"
              />
              <button
                type="submit"
                className="p-4 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition duration-300 shadow-md disabled:opacity-50"
                disabled={loading}
              >
                Login
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
