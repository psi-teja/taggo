"use client"
import Header from '../components/Header';
import Logo from '../components/Logo';
import AccountDetails from '../components/AccountDetails';
import { useAuth } from "@/app/hooks/userAuth";
import { useState } from "react";

const mockProjects = [
  { id: 1, name: "BankStatement", type: "Document Parsing", description: "Annotate and manage invoices." },
  { id: 2, name: "Car Number Plate Detetion", type: "Object Detection", description: "Detect objects in images." },
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
            <main className="flex-1 flex bg-gray-50 min-h-0">
                <div className="flex flex-col md:flex-row w-full h-full">
                    {/* Left: Image section (hidden on small screens) */}
                    <div className="hidden md:flex w-full md:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-blue-200 via-purple-100 to-pink-100 rounded-l-lg h-full">
                        <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80" alt="People collaborating" className="max-w-[70%] rounded-xl shadow-2xl" />
                        <blockquote className="mt-10 text-xl italic text-black text-center max-w-[80%] relative">
                            "Alone we can do so little; together we can do so much."
                            <span className="block text-base text-gray-500 absolute right-2 bottom-[-2rem]">
                                – Helen Keller
                            </span>
                        </blockquote>
                    </div>
                    {/* Right: Projects section */}
                    <div className="w-full md:w-1/2 flex flex-col p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold">Your Projects</h1>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                onClick={() => setShowModal(true)}
                            >
                                + Create Project
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4 rounded shadow hover:shadow-lg transition border border-blue-200"
                                >
                                    <h2 className="text-lg font-semibold text-blue-700">{project.name}</h2>
                                    <p className="text-sm text-purple-600 font-medium mb-1">{project.type}</p>
                                </div>
                            ))}
                        </div>
                        {showModal && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                                <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                                    <h2 className="text-xl font-bold mb-4">Create New Project</h2>
                                    <form onSubmit={handleCreateProject}>
                                        <input
                                            className="w-full mb-3 p-2 border rounded"
                                            placeholder="Project Name"
                                            value={newProject.name}
                                            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                            required
                                        />
                                        <select
                                            className="w-full mb-3 p-2 border rounded"
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
                                                className="px-4 py-2 bg-gray-200 rounded"
                                                onClick={() => setShowModal(false)}
                                            >Cancel</button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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

export default Dashboard;