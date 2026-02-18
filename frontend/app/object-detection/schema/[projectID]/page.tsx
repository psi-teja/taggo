"use client";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/app/hooks/axiosInstance";
import { 
  Plus, Trash2, Save, Tags, 
  ChevronLeft, Loader2, CheckCircle2, AlertCircle, Palette
} from "lucide-react";
import Link from "next/link";

interface LabelClass {
  id: string;
  name: string;
  color: string;
}

export default function ObjectDetectionSchema({ params }: { params: { projectID: string } }) {
    const projectId = params.projectID;
    const [projectData, setProjectData] = useState<any>(null);
    const [labels, setLabels] = useState<LabelClass[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(`/projects/${projectId}/`);
                setProjectData(res.data);
                // Object detection schema usually lives in a 'labels' or 'classes' array
                setLabels(res.data.schema?.labels || []);
            } catch (error) { console.error("Fetch Error:", error); }
        };
        fetchData();
    }, [projectId]);

    const isNameDuplicate = (name: string, currentId: string) => {
        if (!name) return false;
        return labels.some(l => l.name.toLowerCase() === name.toLowerCase() && l.id !== currentId);
    };

    const addLabel = () => {
        const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
        setLabels([...labels, { id: crypto.randomUUID(), name: "", color: randomColor }]);
    };

    const saveSchema = async () => {
        const hasEmptyNames = labels.some(l => !l.name);
        const hasDuplicates = new Set(labels.map(l => l.name.toLowerCase())).size !== labels.length;

        if (hasEmptyNames || hasDuplicates) {
            alert("Please ensure all label names are unique and non-empty.");
            return;
        }

        setIsSaving(true);
        try {
            await axiosInstance.patch(`/projects/${projectId}/`, {
                schema: { labels }
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e) { alert("Save failed"); } finally { setIsSaving(false); }
    };

    if (!projectData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/${projectData.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20}/></Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 leading-none mb-1">{projectData.name}</h1>
                            <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Object Detection Labels</p>
                        </div>
                    </div>
                    <button onClick={saveSchema} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all">
                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : (saveSuccess ? <CheckCircle2 size={16}/> : <Save size={16}/>)}
                        {saveSuccess ? "Labels Saved" : "Save Classes"}
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto w-full p-8 space-y-8">
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                                <Tags size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Annotation Classes</h2>
                                <p className="text-xs text-slate-500">Define the labels for bounding boxes</p>
                            </div>
                        </div>
                        <button onClick={addLabel} className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm">
                           <Plus size={16} /> Add New Class
                        </button>
                    </div>

                    <div className="space-y-3">
                        {labels.map((label) => {
                            const isDup = isNameDuplicate(label.name, label.id);
                            return (
                                <div key={label.id} className={`flex items-center gap-4 p-4 bg-white border rounded-2xl group transition-all ${isDup ? 'border-rose-400 ring-4 ring-rose-50' : 'border-slate-200 hover:border-indigo-100 shadow-sm'}`}>
                                    {/* Color Picker Indicator */}
                                    <div className="relative group/color">
                                        <input 
                                            type="color"
                                            value={label.color}
                                            onChange={(e) => setLabels(labels.map(l => l.id === label.id ? {...l, color: e.target.value} : l))}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white mix-blend-difference opacity-0 group-hover/color:opacity-100 transition-opacity">
                                            <Palette size={14} />
                                        </div>
                                    </div>

                                    {/* Name Input */}
                                    <div className="flex-1">
                                        <input 
                                            className={`w-full bg-transparent border-none text-base font-bold focus:ring-0 placeholder:text-slate-300 ${isDup ? 'text-rose-600' : 'text-slate-700'}`} 
                                            placeholder="Label Name (e.g. Car, Tree, Damage)" 
                                            value={label.name}
                                            onChange={(e) => setLabels(labels.map(l => l.id === label.id ? {...l, name: e.target.value} : l))}
                                        />
                                        {isDup && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase mt-1">
                                                <AlertCircle size={12}/> Name already exists
                                            </span>
                                        )}
                                    </div>

                                    {/* Preview Badge */}
                                    <div 
                                        className="hidden md:block px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border"
                                        style={{ backgroundColor: `${label.color}15`, borderColor: label.color, color: label.color }}
                                    >
                                        {label.name || "Preview"}
                                    </div>

                                    {/* Delete */}
                                    <button 
                                        onClick={() => setLabels(labels.filter(l => l.id !== label.id))} 
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            );
                        })}

                        {labels.length === 0 && (
                            <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                                <p className="text-slate-400 font-medium text-sm">No labels defined yet. Click "Add New Class" to start.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}