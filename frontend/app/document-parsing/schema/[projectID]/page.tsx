"use client";
import type { Project as ProjectType } from "@/app/components/Project";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/hooks/axiosInstance";
import { 
  Plus, 
  Trash2, 
  Save, 
  Tag as TagIcon, 
  ChevronLeft,
  Loader2,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

interface Label {
  id: string;
  name: string;
  color: string;
}

export default function SchemaPage({ params }: { params: { projectID: string } }) {
    const projectId = params.projectID;
    const [projectData, setProjectData] = useState<ProjectType | null>(null);
    const [labels, setLabels] = useState<Label[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                const response = await axiosInstance.get(`/projects/${projectId}/`);
                setProjectData(response.data);
                // Assuming labels are stored in response.data.schema.labels
                setLabels(response.data.schema?.labels || []);
            } catch (error) {
                console.error("Error fetching project details:", error);
            }
        }
        fetchProjectDetails();
    }, [projectId]);

    const addLabel = () => {
        const newLabel: Label = {
            id: crypto.randomUUID(),
            name: "New Label",
            color: "#14b8a6" // Default teal-500
        };
        setLabels([...labels, newLabel]);
    };

    const updateLabel = (id: string, field: keyof Label, value: string) => {
        setLabels(labels.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const deleteLabel = (id: string) => {
        setLabels(labels.filter(l => l.id !== id));
    };

    const saveSchema = async () => {
        setIsSaving(true);
        try {
            await axiosInstance.patch(`/projects/${projectId}/`, {
                schema: { labels }
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            alert("Failed to save schema");
        } finally {
            setIsSaving(false);
        }
    };

    if (!projectData) return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-teal-500" size={32} />
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* --- Sticky Header --- */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                {projectData.name} <span className="text-slate-400 font-medium mx-2">/</span> Schema
                            </h1>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Define your annotation taxonomy</p>
                        </div>
                    </div>

                    <button 
                        onClick={saveSchema}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : (saveSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />)}
                        {saveSuccess ? "Saved!" : "Save Configuration"}
                    </button>
                </div>
            </header>

            <main className="flex-1 p-8">
                <div className="max-w-5xl mx-auto">
                    {/* --- Helper Info --- */}
                    <div className="mb-8 p-6 bg-teal-500/5 border border-teal-500/10 rounded-2xl flex items-start gap-4">
                        <div className="p-2 bg-teal-500/20 rounded-lg text-teal-600">
                            <TagIcon size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Annotation Labels</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Define the categories your team will use to label data. Each label requires a unique name and a distinct color for visual clarity during the annotation process.
                            </p>
                        </div>
                    </div>

                    {/* --- Labels Grid --- */}
                    <div className="grid gap-4">
                        {labels.map((label) => (
                            <div 
                                key={label.id}
                                className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all hover:border-teal-500/30"
                            >
                                <input 
                                    type="color" 
                                    value={label.color}
                                    onChange={(e) => updateLabel(label.id, 'color', e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                                />
                                <input 
                                    type="text" 
                                    value={label.name}
                                    onChange={(e) => updateLabel(label.id, 'name', e.target.value)}
                                    placeholder="Label Name (e.g., Person, Invoice Date)"
                                    className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300"
                                />
                                <button 
                                    onClick={() => deleteLabel(label.id)}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}

                        <button 
                            onClick={addLabel}
                            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-bold hover:border-teal-500/50 hover:text-teal-500 transition-all"
                        >
                            <Plus size={20} />
                            Add New Label
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}