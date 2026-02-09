"use client"
import Header from '../components/Header';
import Logo from '../components/Logo';
import AccountDetails from '../components/AccountDetails';
import { useAuth } from "@/app/hooks/userAuth";
import { useState } from "react";
import withAuth from '../hooks/withAuth';

const mockProjects = [
    { id: 1, name: "BankStatement", type: "document-parsing", description: "Annotate and manage invoices." },
    { id: 2, name: "Car Number Plate Detetion", type: "object-detection", description: "Detect objects in images." },
];

const Dashboard = () => {
    const { loggedInUser } = useAuth();
    const [projects, setProjects] = useState(mockProjects);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: "", type: "", description: "" });

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProject.name) return;
        setProjects([
            ...projects,
            { id: Date.now(), ...newProject }
        ]);
        setNewProject({ name: "", type: "", description: "" });
        setShowModal(false);
    };

    return (
        <div className="flex flex-col h-screen">
            <Header>
                <Logo />
                {loggedInUser && <AccountDetails loggedInUser={loggedInUser} />}
            </Header>
            <main className="flex-1 flex bg-bg-base min-h-0">
                <div className="flex flex-col md:flex-row w-full h-full">
                    {/* Left: Image section (hidden on small screens) */}
                    <div className="hidden md:flex w-full md:w-1/2 flex-col items-center justify-center bg-gradient-to-b from-brand-200 via-accent-500 to-bg-alt rounded-l-lg h-full">
                        <img
                            src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"
                            alt="People collaborating"
                            className="max-w-[70%] rounded-xl shadow-glow"
                        />
                        <blockquote className="mt-10 text-xl italic text-brand-900 text-center max-w-[80%] relative">
                            "Alone we can do so little; together we can do so much."
                            <span className="block text-base text-brand-700 absolute right-2 bottom-[-2rem]">
                                – Helen Keller
                            </span>
                        </blockquote>
                    </div>
                    {/* Right: Projects section */}
                    <div className="w-full md:w-1/2 flex flex-col p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-brand-800">Your Projects</h1>
                            <button
                                className="bg-brand-500 text-white px-4 py-2 rounded hover:bg-brand-600"
                                onClick={() => setShowModal(true)}
                            >
                                + Create Project
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {projects.map((project) => (
                                <a
                                    key={project.id}
                                    href={`dashboard/${project.id}`}
                                    className="bg-gradient-to-br from-brand-50 via-bg-alt to-accent-500 p-4 rounded shadow-sm hover:shadow-md transition border border-brand-100 block cursor-pointer"
                                >
                                    <h2 className="text-lg font-semibold text-brand-700">{project.name}</h2>
                                    <p className="text-sm text-accent-500 font-medium mb-1">{project.type}</p>
                                </a>
                            ))}
                        </div>
                        {showModal && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                                <div className="bg-bg-surface p-6 rounded shadow-lg w-full max-w-md">
                                    <h2 className="text-xl font-bold mb-4 text-brand-800">Create New Project</h2>
                                    <form onSubmit={handleCreateProject}>
                                        <input
                                            className="w-full mb-3 p-2 border border-brand-100 rounded bg-bg-base text-brand-900"
                                            placeholder="Project Name"
                                            value={newProject.name}
                                            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                            required
                                        />
                                        <select
                                            className="w-full mb-3 p-2 border border-brand-100 rounded bg-bg-base text-brand-900"
                                            value={newProject.type}
                                            onChange={e => setNewProject({ ...newProject, type: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>
                                                Select Project Type
                                            </option>
                                            <option value="Document Parsing">Document Parsing</option>
                                            <option value="Object Detection">Object Detection</option>
                                            <option value="Classification">Classification</option>
                                            <option value="Segmentation">Segmentation</option>
                                        </select>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                className="px-4 py-2 bg-brand-100 text-brand-700 rounded"
                                                onClick={() => setShowModal(false)}
                                            >Cancel</button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
                                            >Create</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default withAuth(Dashboard);