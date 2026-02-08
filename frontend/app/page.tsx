"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
            <main className="flex flex-1 items-center justify-center min-h-[70vh]">
                <div
                    ref={containerRef}
                    className="flex flex-col items-center justify-center py-24 px-4 sm:px-8 w-full"
                >
                    {loggedInUser && (
                        <div className="mb-8 flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-100 to-cyan-100 shadow text-gray-700 animate-card-enter">
                            <div className="bg-teal-400/80 rounded-full p-2">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                            <span>
                                Logged in as <span className="font-semibold text-teal-700">{loggedInUser.username}</span>
                            </span>
                        </div>
                    )}
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
                            href={superuserExists ? "/dashboard" : "/create-superuser"}
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
                    {/* Feature cards with unique icons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl w-full mt-8">
                        {[
                            {
                                title: "Organize",
                                desc: "Group and categorize your projects for easy access and management.",
                                icon: (
                                    <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <rect x="3" y="3" width="18" height="18" rx="4" />
                                        <path d="M7 7h10v10H7z" />
                                    </svg>
                                ),
                                border: "border-teal-100",
                                bg: "bg-teal-100",
                                hoverBg: "hover:bg-teal-50/80",
                            },
                            {
                                title: "Annotate",
                                desc: "Streamline your workflow with smart annotation tools that automate tedious tasks and ensure your tags stay accurate and current.",
                                icon: (
                                    <svg className="w-10 h-10 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19.5l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                ),
                                border: "border-cyan-100",
                                bg: "bg-cyan-100",
                                hoverBg: "hover:bg-cyan-50/80",
                            },
                            {
                                title: "Share",
                                desc: "Easily share your tags and collections with teammates.",
                                icon: (
                                    <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
                                        <polyline points="16 6 12 2 8 6" />
                                        <line x1="12" y1="2" x2="12" y2="15" />
                                    </svg>
                                ),
                                border: "border-teal-100",
                                bg: "bg-teal-100",
                                hoverBg: "hover:bg-teal-50/80",
                            },
                            {
                                title: "Private & Secure",
                                desc: "Your data never leaves your network. Taggo is designed for privacy—no external data transfers, ensuring your information stays safe and local.",
                                icon: (
                                    <svg className="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <rect x="3" y="11" width="18" height="10" rx="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                ),
                                border: "border-cyan-100",
                                bg: "bg-cyan-100",
                                hoverBg: "hover:bg-cyan-50/80",
                            },
                            {
                                title: "Workflow Annotation",
                                desc: (
                                    <>
                                        Taggo supports annotation workflows with <span className="font-semibold text-cyan-600">review</span>, <span className="font-semibold text-teal-600">superreview</span>, and <span className="font-semibold text-teal-700">completed</span> stages—ensuring quality and accountability at every step.
                                    </>
                                ),
                                icon: (
                                    <svg className="w-10 h-10 text-cyan-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v4l3 3" />
                                    </svg>
                                ),
                                border: "border-cyan-100",
                                bg: "bg-cyan-100",
                                hoverBg: "hover:bg-cyan-50/80",
                            },
                            {
                                title: "Pre-labelling",
                                desc: (
                                    <>
                                        Accelerate your annotation workflow with <span className="font-semibold text-teal-600">pre-labelling</span>—automatically generate initial tags using AI or rules, then review and refine for accuracy.
                                    </>
                                ),
                                icon: (
                                    <svg className="w-10 h-10 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                ),
                                border: "border-teal-100",
                                bg: "bg-teal-100",
                                hoverBg: "hover:bg-teal-50/80",
                            },
                        ].map((card, idx) => (
                            <div
                                key={card.title}
                                className={`bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center transition-all ${card.border} ${card.hoverBg} group hover:shadow-2xl hover:-translate-y-2`}
                                data-anim-card
                            >
                                <div className={`${card.bg} rounded-full p-4 mb-4 group-hover:scale-110 transition`}>
                                    {card.icon}
                                </div>
                                <h3 className="font-bold text-xl mb-2 text-gray-900">{card.title}</h3>
                                <p className="text-gray-500 text-center">{card.desc}</p>
                            </div>
                        ))}
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

// Add custom animation to global styles
// In globals.css or tailwind.config.js, add:
// @keyframes bgMove {
//   0%, 100% { background-position: 0% 0%, 100% 100%; }
//   50% { background-position: 50% 50%, 50% 50%; }
// }
// .animate-bgMove { animation: bgMove 10s ease-in-out infinite; }
