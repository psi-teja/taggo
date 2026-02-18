"use client";

import { useEffect, useState } from "react";
import Header from '../components/Header';
import { Tag } from 'lucide-react';
import AccountDetails from '../components/AccountDetails';
import { useAuth } from "@/app/hooks/userAuth";
import withAuth from '../hooks/withAuth';
import axiosInstance from '../hooks/axiosInstance';

// Import the combined components we built in the previous step
import CreateProjectModal, { ProjectCard, Project } from '@/app/components/Project';
import { Loader2, FolderPlus, Rocket, Plus } from 'lucide-react';

const Dashboard = () => {
    const { loggedInUser } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch projects from Django Backend
    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            // axiosInstance already uses your HOST_IP / baseURL
            const response = await axiosInstance.get(`/projects/`);
            if (response.status === 200) {
                setProjects(response.data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateProject = async (projectData: { name: string; task_type: string }) => {
        try {
            const response = await axiosInstance.post(`/projects/create/`, projectData);
            if (response.status === 201) {
                await fetchProjects(); // Refresh list
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            alert("Failed to create project. Please check your backend connection.");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            <Header>
                <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                        <Tag size={18} strokeWidth={3} />
                    </div>
                    <span className="text-xl font-black tracking-tight text-slate-900 uppercase">Taggo</span>
                </a>
                {loggedInUser && <AccountDetails loggedInUser={loggedInUser} />}
            </Header>

            <main className="flex-1 flex overflow-hidden">
                <div className="flex w-full h-full">

                    {/* Left Section: Visual Branding & Inspiration */}
                    <div className="hidden lg:flex w-1/3 flex-col items-center justify-center bg-slate-50 border-r border-slate-100 p-12">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <img
                                src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"
                                alt="Space/Collaboration"
                                className="relative max-w-full rounded-2xl shadow-2xl grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                            />
                        </div>

                        <div className="mt-12 text-center space-y-4">
                            <Rocket className="mx-auto text-blue-500 animate-bounce" size={32} />
                            <blockquote className="text-xl font-medium text-slate-800 italic leading-relaxed">
                                "The best way to predict the future is to invent it."
                                <footer className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">— Alan Kay</footer>
                            </blockquote>
                        </div>
                    </div>

                    {/* Right Section: Project Management (FR-02) */}
                    <div className="flex-1 flex flex-col p-8 md:p-12 bg-white ">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                    Welcome back, {loggedInUser?.username || 'Annotator'}
                                </h1>
                                <p className="text-slate-500 mt-1">Manage your projects and annotation tasks.</p>
                            </div>
                            <button
                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                onClick={() => setShowModal(true)}
                            >
                                <Plus size={20} />
                                Create Project
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="animate-spin text-blue-500" size={40} />
                            </div>
                        ) : projects.length > 0 ? (
                            // Responsive Grid for Project Cards with scroll only on this list
                            <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto">
                                {projects.map((project) => (
                                    <ProjectCard key={project.id} project={project} />
                                ))}
                            </div>
                        ) : (
                            /* Empty State: Fulfills Usability NFR */
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50 p-12 text-center">
                                <div className="p-6 bg-white rounded-3xl shadow-sm mb-6">
                                    <FolderPlus className="text-slate-300" size={48} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">No projects yet</h3>
                                <p className="text-slate-500 max-w-xs mt-2">
                                    Get started by creating your first project and uploading a dataset.
                                </p>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-6 text-blue-600 font-bold hover:text-blue-700 underline underline-offset-4"
                                >
                                    Create your first project
                                </button>
                            </div>
                        )}

                        {/* Modal Integration */}
                        <CreateProjectModal
                            showModal={showModal}
                            setShowModal={setShowModal}
                            handleCreateProject={handleCreateProject}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default withAuth(Dashboard);