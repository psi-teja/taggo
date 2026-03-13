"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { LockKeyhole } from 'lucide-react';
import axiosInstance from "../hooks/axiosInstance";
import { setAccessToken, setRefreshToken, setLoggedInUser } from "../hooks/authStorage";

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const next = searchParams.get("next") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await axiosInstance.post<LoginResponse>(`/token/`, {
        username,
        password,
      });

      setAccessToken(data.access);
      setRefreshToken(data.refresh);

      const decoded: any = jwtDecode(data.access);

      const loggedInUser: UserData = {
        username: decoded.username,
        email: decoded.email,
        first_name: decoded.first_name,
        last_name: decoded.last_name,
        is_superuser: decoded.is_superuser,
        groups: decoded.groups,
      };

      setLoggedInUser(loggedInUser);

      router.push(next);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.error === "User does not exist") {
        setError("User does not exist");
      } else {
        setError("Invalid username or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid lg:grid-cols-2 shadow-2xl rounded-3xl overflow-hidden">
        {/* Left Section: Visual Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-white dark:bg-slate-800/50 p-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <img
              src="/invent.jpeg"
              alt="Inspiration"
              className="relative max-w-sm rounded-2xl shadow-2xl grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
          <div className="mt-12 text-center space-y-4">
              <LockKeyhole className="mx-auto text-blue-500 animate-bounce" size={32} />
            <blockquote className="text-xl font-medium text-slate-800 dark:text-slate-300 italic leading-relaxed">
              "The future is already here — it's just not evenly distributed."
              <footer className="mt-2 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">— William Gibson</footer>
            </blockquote>
          </div>
        </div>

        {/* Right Section: Login Form */}
        <div className="bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 p-8 md:p-12 flex flex-col justify-center">
          {loading ? (
            <div className="text-center">
              <div className="loader border-t-4 border-teal-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Logging you in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex justify-center mb-6">
                <img src="/logo.png" alt="Taggo Logo" className="h-12" />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">Welcome Back</h1>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-8">Please login to your account.</p>

              {error && <p className="text-red-500 mb-4 text-center font-medium">{error}</p>}

              <div className="space-y-6">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 p-3 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 p-3 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-2.175 2.175L3 3z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-8 p-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold text-lg hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50 transform transition-transform duration-150 hover:scale-105 shadow-lg disabled:opacity-50"
                disabled={loading}
              >
                Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
