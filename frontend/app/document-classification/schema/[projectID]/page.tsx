"use client";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/app/hooks/axiosInstance";
import { 
  Plus, Trash2, Save, Type, Grid3X3, 
  ChevronLeft, Loader2, CheckCircle2, AlertCircle, Tag
} from "lucide-react";
import Link from "next/link";

interface ClassificationClass {
  id: string;
  name: string;
}

export default function ClassificationSchemaPage({ params }: { params: { projectID: string } }) {
    const projectId = params.projectID;
    const [projectData, setProjectData] = useState<any>(null);
    const [classes, setClasses] = useState<ClassificationClass[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(`/projects/${projectId}/`);
                setProjectData(res.data);
                const schema = res.data.schema || {};
                setClasses(schema.classes || []);
            } catch (error) { console.error("Fetch Error:", error); }
        };
        fetchData();
    }, [projectId]);

    // --- Validation Logic ---
    const isClassNameDuplicate = (name: string, currentId: string) => {
        if (!name) return false;
        return classes.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== currentId);
    };

    // --- Actions ---
    const addClass = () => setClasses([...classes, { id: crypto.randomUUID(), name: "" }]);

    const saveSchema = async () => {
        setValidationErrors([]);
        const errors: string[] = [];

        // Check for empty names
        classes.forEach(c => { if (!c.name) errors.push(c.id); });

        // Check for duplicate names
        const allClassNames = new Map<string, string[]>();
        classes.forEach(c => {
            const norm = c.name.toLowerCase();
            if (norm) {
                if (!allClassNames.has(norm)) allClassNames.set(norm, []);
                allClassNames.get(norm)!.push(c.id);
            }
        });

        allClassNames.forEach((ids) => {
            if (ids.length > 1) errors.push(...ids);
        });

        if (errors.length > 0) {
            setValidationErrors(Array.from(new Set(errors)));
            return;
        }

        setIsSaving(true);
        try {
            await axiosInstance.patch(`/projects/${projectId}/`, {
                schema: { classes }
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e) { alert("Save failed"); } finally { setIsSaving(false); }
    };

    if (!projectData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-500" /></div>;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/${projectData.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20}/></Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 leading-none mb-1">Project: {projectData.name}</h1>
                            <p className="text-[10px] uppercase font-bold text-teal-600 tracking-wider">Document Classification</p>
                        </div>
                    </div>
                    <button onClick={saveSchema} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all">
                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : (saveSuccess ? <CheckCircle2 size={16}/> : <Save size={16}/>)}
                        {saveSuccess ? "Schema Saved" : "Save Changes"}
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto w-full p-8 space-y-12 pb-32">
                {validationErrors.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 mb-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={20} />
                            <h3 className="font-bold text-lg">Please fix the errors</h3>
                        </div>
                        <p className="text-sm mt-2 ml-8">Ensure all classes have unique, non-empty names before saving.</p>
                    </div>
                )}

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-teal-500 shadow-sm">
                                <Tag size={20} />
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Classification Classes</h2>
                        </div>
                        <button onClick={addClass} className="group flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors">
                           <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Class
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {classes.map((c) => {
                            const isDup = isClassNameDuplicate(c.name, c.id);
                            const hasError = validationErrors.includes(c.id);
                            return (
                                <div key={c.id} className={`flex items-center gap-2 p-3 bg-white border rounded-2xl group transition-all ${hasError || isDup ? 'border-rose-400 ring-4 ring-rose-50' : 'border-slate-200 hover:border-teal-200'}`}>
                                    <input 
                                        className={`flex-1 bg-transparent border-none text-sm font-semibold focus:ring-0 placeholder:text-slate-300 text-slate-700`} 
                                        placeholder="e.g. Invoice, Receipt, Contract" 
                                        value={c.name}
                                        onChange={(e) => setClasses(classes.map(item => item.id === c.id ? {...item, name: e.target.value} : item))}
                                    />
                                    {(isDup || (hasError && !c.name)) && <AlertCircle size={14} className="text-rose-500" />}
                                    <button onClick={() => setClasses(classes.filter(item => item.id !== c.id))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
}
