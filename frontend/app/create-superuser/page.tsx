"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Crown } from 'lucide-react';

export default function CreateSuperuser() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }

    try {
      console.log("API_BASE_URL:", API_BASE_URL);
      await axios.post(
        `${API_BASE_URL}/create-superuser/`,
        { username, email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      setSuccess(true);
      setTimeout(() => router.replace("/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create superuser");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid lg:grid-cols-2 shadow-2xl rounded-3xl overflow-hidden">
        {/* Left Section: Visual Branding & Inspiration */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-slate-300 dark:bg-slate-800/50 p-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <img
              src="/power.png"
              alt="Inspiration"
              className="relative max-w-sm rounded-2xl shadow-2xl grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
          <div className="mt-12 text-center space-y-4">
            <Crown className="mx-auto text-blue-500 animate-bounce" size={32} />
            <blockquote className="text-xl font-medium text-slate-800 dark:text-slate-300 italic leading-relaxed">
              "With great power comes great responsibilities."
              <footer className="mt-2 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">— Uncle Ben</footer>
            </blockquote>
          </div>
        </div>

        {/* Right Section: Create Superuser Form */}
        <div className="bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 p-8 md:p-12 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="Taggo Logo" className="h-12" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">Create Superuser</h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">Set up the administrative account.</p>
            
            {error && <p className="text-red-500 mb-4 text-center font-medium">{error}</p>}
            {success && <p className="text-green-600 mb-4 text-center font-medium">Superuser created! Redirecting...</p>}
            
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
                  onChange={e => setUsername(e.target.value)}
                  className="pl-10 p-3 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 p-3 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
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
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 p-3 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
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
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <input
                  type={showPassword2 ? "text" : "password"}
                  placeholder="Re-enter Password"
                  value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  className="pl-10 p-3 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <button type="button" onClick={() => setShowPassword2(!showPassword2)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {showPassword2 ? (
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
              className="w-full mt-8 p-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold text-lg hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50 transform transition-transform duration-150 hover:scale-105 shadow-lg"
            >
              Create Superuser
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
