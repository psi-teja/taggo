"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from './components/Header';
import Logo from './components/Logo';
import AccountDetails from './components/AccountDetails';
import { useAuth } from "@/app/hooks/userAuth";
import axios from "axios";

function Home() {
    const { loggedInUser } = useAuth();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement | null>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

    const [superuserExists, setSuperuserExists] = useState<boolean | null>(null);
    const [apiUrlError, setApiUrlError] = useState<string>("");

    useEffect(() => {
        console.log("[Taggo] API_BASE_URL:", API_BASE_URL);
        if (!API_BASE_URL) {
            setApiUrlError("API_BASE_URL is not set. Please ensure the environment variable NEXT_PUBLIC_API_BASE_URL is configured. The frontend cannot reach the backend.");
        }
    }, []);

    useEffect(() => {
        if (!API_BASE_URL) return;
        async function checkSuperuser() {
            try {
                const res = await axios.get(`${API_BASE_URL}/check-superuser`);
                setSuperuserExists(res.data && res.data.superuser_exists);
                if (res.data && res.data.superuser_exists === false && loggedInUser) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('loggedInUser');
                }
                // Auto-redirect to create-superuser if no superuser exists
                if (res.data && res.data.superuser_exists === false && router && window.location.pathname !== "/create-superuser") {
                    router.replace("/create-superuser");
                }
            } catch (e) {
                console.error("Error checking superuser:", e);
            }
        }
        checkSuperuser();
    }, [router, loggedInUser, API_BASE_URL]);

    useEffect(() => {
        const cards = containerRef.current?.querySelectorAll('[data-anim-card]');
        if (!cards) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            cards.forEach(c => c.classList.remove('opacity-0', 'translate-y-8'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-card-enter');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 }
        );
        cards.forEach(card => observer.observe(card));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-teal-50 via-cyan-50 to-white animate-gradientShift">            
            {apiUrlError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4 text-center">
                    <strong>Error:</strong> {apiUrlError}
                </div>
            )}
            {
                loggedInUser && (
                    <Header>
                        <Logo />
                        <AccountDetails loggedInUser={loggedInUser} />
                    </Header>
                )
            }
            <main className="flex flex-1 items-center justify-center min-h-[70vh]">
                <div
                    ref={containerRef}
                    className="flex flex-col items-center justify-center py-24 px-4 sm:px-8 w-full"
                >
                    <h1
                        className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-4 text-center drop-shadow-lg"
                        data-anim-card
                    >
                        Welcome to <span className="text-teal-500">Taggo</span>
                    </h1>
                    <p
                        className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-2xl text-center"
                        data-anim-card
                    >
                        Effortless <span className="text-teal-500 font-semibold">annotation</span> and <span className="text-cyan-500 font-semibold">collaboration</span> for your team!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mb-16" data-anim-card>
                          <Link
                              href={superuserExists? "/dashboard" : "/create-superuser"}
                              className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-bold shadow-lg hover:scale-105 hover:from-teal-500 hover:to-cyan-600 transition-all text-lg"
                          >
                              {loggedInUser ? "Go to Dashboard" : "Get Started"}
                          </Link>
                        {!loggedInUser && (
                            <Link
                                href="/login"
                                className="inline-block px-8 py-4 rounded-xl border-2 border-teal-400 text-teal-600 font-bold hover:bg-teal-50 transition-all text-lg shadow"
                            >
                                Log In
                            </Link>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl w-full mt-8">
                        <div
                            className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center transition-all border border-teal-100 hover:shadow-2xl hover:-translate-y-2 hover:bg-teal-50/80 group"
                            data-anim-card
                        >
                            <div className="bg-teal-100 rounded-full p-4 mb-4 group-hover:scale-110 transition">
                                <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h3 className="font-bold text-xl mb-2 text-gray-900">Organize</h3>
                            <p className="text-gray-500 text-center">Group and categorize your tags for easy access and management.</p>
                        </div>
                        <div
                            className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center transition-all border border-cyan-100 hover:shadow-2xl hover:-translate-y-2 hover:bg-cyan-50/80 group"
                            data-anim-card
                        >
                            <div className="bg-cyan-100 rounded-full p-4 mb-4 group-hover:scale-110 transition">
                                <svg className="w-10 h-10 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-xl mb-2 text-gray-900">Automate</h3>
                            <p className="text-gray-500 text-center">Let Taggo handle repetitive tasks and keep your tags up to date.</p>
                        </div>
                        <div
                            className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center transition-all border border-teal-100 hover:shadow-2xl hover:-translate-y-2 hover:bg-teal-50/80 group"
                            data-anim-card
                        >
                            <div className="bg-teal-100 rounded-full p-4 mb-4 group-hover:scale-110 transition">
                                <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M17 16l4-4m0 0l-4-4m4 4H7" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h3 className="font-bold text-xl mb-2 text-gray-900">Share</h3>
                            <p className="text-gray-500 text-center">Easily share your tags and collections with friends or teammates.</p>
                        </div>
                    </div>
                </div>
            </main>
            {/* Decorative bottom wave */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-32">
                    <path fill="url(#wave-gradient)" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,80C672,64,768,64,864,80C960,96,1056,128,1152,128C1248,128,1344,96,1392,80L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
                    <defs>
                        <linearGradient id="wave-gradient" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#5eead4" />
                            <stop offset="1" stopColor="#67e8f9" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    );
}

export default Home;
