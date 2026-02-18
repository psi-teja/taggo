"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from "@/app/hooks/userAuth";
import axiosInstance from './hooks/axiosInstance';
import { clearAuthStorage } from "@/app/hooks/authStorage";
import { 
  ArrowRight, Layout, Tag, Share2, 
  ShieldCheck, GitBranch, Zap, 
  UserCircle, Loader2 
} from "lucide-react";

function Home() {
    const { loggedInUser } = useAuth();
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [superuserExists, setSuperuserExists] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkSuperuser() {
            try {
                const res = await axiosInstance.get(`/check-superuser`);
                setSuperuserExists(res.data && res.data.superuser_exists);
                if (res.data && res.data.superuser_exists === false && loggedInUser) {
                    clearAuthStorage();
                }
                if (res.data && res.data.superuser_exists === false && router && window.location.pathname !== "/create-superuser") {
                    router.replace("/create-superuser");
                }
            } catch (e) {
                console.error("Error checking superuser:", e);
            }
        }
        checkSuperuser();
    }, [router, loggedInUser]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Minimal Navigation Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                            <Tag size={18} strokeWidth={3} />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900 uppercase">Taggo</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {loggedInUser ? (
                            <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                <UserCircle size={18} className="text-teal-600" />
                                <span className="text-xs font-bold text-slate-600">{loggedInUser.username}</span>
                            </div>
                        ) : (
                            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-teal-600">Log In</Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-20">
                {/* Hero Section */}
                <div ref={containerRef} className="text-center mb-24">
                    <h1 className="text-6xl sm:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.9]">
                        Effortless <span className="text-teal-500">Annotation</span> <br />
                        & Collaboration.
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                        The modern workbench for document annotation. Group projects, define schemas, and accelerate extraction with team-ready workflows.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href={superuserExists ? "/dashboard" : "/create-superuser"}
                            className="group flex items-center gap-2 px-8 py-4 bg-teal-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-teal-500/20 hover:bg-teal-600 hover:-translate-y-1 transition-all"
                        >
                            {loggedInUser ? "Go to Dashboard" : "Get Started"}
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        {!loggedInUser && (
                            <Link
                                href="/login"
                                className="px-8 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-lg hover:bg-white hover:border-teal-500 transition-all"
                            >
                                Login to Workspace
                            </Link>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            title: "Organize",
                            desc: "Group and categorize your projects for easy access and management.",
                            icon: <Layout size={24} />,
                            color: "text-blue-500",
                            bg: "bg-blue-50"
                        },
                        {
                            title: "Annotate",
                            desc: "Smart annotation tools that automate tedious tasks and ensure accuracy.",
                            icon: <Tag size={24} />,
                            color: "text-teal-500",
                            bg: "bg-teal-50"
                        },
                        {
                            title: "Share",
                            desc: "Seamlessly distribute tasks and collections among your team.",
                            icon: <Share2 size={24} />,
                            color: "text-purple-500",
                            bg: "bg-purple-50"
                        },
                        {
                            title: "Private & Secure",
                            desc: "Data stays local. Designed for privacy—no external data transfers.",
                            icon: <ShieldCheck size={24} />,
                            color: "text-rose-500",
                            bg: "bg-rose-50"
                        },
                        {
                            title: "Workflow",
                            desc: "Supports Review, Super-Review, and Completion stages for quality.",
                            icon: <GitBranch size={24} />,
                            color: "text-indigo-500",
                            bg: "bg-indigo-50"
                        },
                        {
                            title: "Pre-labelling",
                            desc: "Accelerate extraction using AI-generated initial tags for refinement.",
                            icon: <Zap size={24} />,
                            color: "text-amber-500",
                            bg: "bg-amber-50"
                        },
                    ].map((card) => (
                        <div
                            key={card.title}
                            className="bg-white border border-slate-200 p-8 rounded-[2rem] hover:shadow-2xl hover:shadow-slate-200/50 hover:border-teal-500/30 transition-all group"
                        >
                            <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                {card.icon}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3">{card.title}</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                {card.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Subtle Footer */}
            <footer className="py-12 border-t border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} Taggo Workspace &bull; Local Deployment
                </p>
            </footer>
        </div>
    );
}

export default Home;