"use client";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/app/hooks/axiosInstance";
import { 
  Plus, Trash2, Save, Type, Grid3X3, 
  ChevronLeft, Loader2, CheckCircle2, AlertCircle 
} from "lucide-react";
import Link from "next/link";

interface SchemaField {
  id: string;
  name: string;
}

interface SchemaTable {
  id: string;
  tableName: string;
  columns: { id: string; name: string }[];
}

export default function SchemaPage({ params }: { params: { projectID: string } }) {
    const projectId = params.projectID;
    const [projectData, setProjectData] = useState<any>(null);
    const [fields, setFields] = useState<SchemaField[]>([]);
    const [tables, setTables] = useState<SchemaTable[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(`/projects/${projectId}/`);
                setProjectData(res.data);
                const schema = res.data.schema || {};
                setFields(schema.fields || []);
                setTables(schema.tables || []);
            } catch (error) { console.error("Fetch Error:", error); }
        };
        fetchData();
    }, [projectId]);

    // --- Validation Logic ---

    // Check if a table name is duplicated
    const isTableNameDuplicate = (name: string, currentId: string) => {
        if (!name) return false;
        return tables.some(t => t.tableName.toLowerCase() === name.toLowerCase() && t.id !== currentId);
    };

    // Check if a field/column name is duplicated anywhere in the schema
    const isFieldNameDuplicate = (name: string, currentId: string) => {
        if (!name) return false;
        const normalized = name.toLowerCase();
        
        // Check singular fields
        const inFields = fields.some(f => f.name.toLowerCase() === normalized && f.id !== currentId);
        if (inFields) return true;

        // Check all columns in all tables
        const inTables = tables.some(t => 
            t.columns.some(col => col.name.toLowerCase() === normalized && col.id !== currentId)
        );
        
        return inTables;
    };

    // --- Actions ---

    const addField = () => setFields([...fields, { id: crypto.randomUUID(), name: "" }]);

    const addTable = () => {
        setTables([...tables, { 
            id: crypto.randomUUID(), 
            tableName: "", 
            columns: [{ id: crypto.randomUUID(), name: "" }] 
        }]);
    };

    const addColumn = (tableId: string) => {
        setTables(tables.map(t => t.id === tableId 
            ? { ...t, columns: [...t.columns, { id: crypto.randomUUID(), name: "" }] } 
            : t
        ));
    };

    const saveSchema = async () => {
        const hasEmptyNames = fields.some(f => !f.name) || tables.some(t => !t.tableName || t.columns.some(c => !c.name));
        
        // Collect all names to check for any duplicates at the last second
        const allNames = [
            ...fields.map(f => f.name.toLowerCase()),
            ...tables.flatMap(t => t.columns.map(c => c.name.toLowerCase()))
        ];
        const hasDuplicates = new Set(allNames).size !== allNames.length || 
                             new Set(tables.map(t => t.tableName.toLowerCase())).size !== tables.length;

        if (hasEmptyNames || hasDuplicates) {
            alert("Please ensure all names are unique and non-empty.");
            return;
        }

        setIsSaving(true);
        try {
            await axiosInstance.patch(`/projects/${projectId}/`, {
                schema: { fields, tables }
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
                            <h1 className="text-xl font-black text-slate-900 leading-none mb-1">Project Schema</h1>
                            <p className="text-[10px] uppercase font-bold text-teal-600 tracking-wider">Document Parsing Config</p>
                        </div>
                    </div>
                    <button onClick={saveSchema} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all">
                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : (saveSuccess ? <CheckCircle2 size={16}/> : <Save size={16}/>)}
                        {saveSuccess ? "Schema Saved" : "Save Changes"}
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto w-full p-8 space-y-12 pb-32">
                {/* 1. Singular Fields Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-teal-500 shadow-sm">
                                <Type size={20} />
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Singular Key-Value Pairs</h2>
                        </div>
                        <button onClick={addField} className="group flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors">
                           <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Field
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {fields.map((f) => {
                            const isDup = isFieldNameDuplicate(f.name, f.id);
                            return (
                                <div key={f.id} className={`flex items-center gap-2 p-3 bg-white border rounded-2xl group transition-all ${isDup ? 'border-rose-400 ring-4 ring-rose-50' : 'border-slate-200 hover:border-teal-200'}`}>
                                    <input 
                                        className={`flex-1 bg-transparent border-none text-sm font-semibold focus:ring-0 placeholder:text-slate-300 ${isDup ? 'text-rose-600' : 'text-slate-700'}`} 
                                        placeholder="e.g. invoice_date" 
                                        value={f.name}
                                        onChange={(e) => setFields(fields.map(item => item.id === f.id ? {...item, name: e.target.value} : item))}
                                    />
                                    {isDup && <AlertCircle size={14} className="text-rose-500" />}
                                    <button onClick={() => setFields(fields.filter(item => item.id !== f.id))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 2. Tabular Entities Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-teal-500 shadow-sm">
                                <Grid3X3 size={20} />
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Tabular Entities</h2>
                        </div>
                        <button onClick={addTable} className="group flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors">
                           <Plus size={16} className="group-hover:rotate-90 transition-transform" /> New Entity
                        </button>
                    </div>

                    <div className="space-y-8">
                        {tables.map((t) => {
                            const tableDup = isTableNameDuplicate(t.tableName, t.id);
                            return (
                                <div key={t.id} className={`bg-white border ${tableDup ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200'} rounded-[2rem] overflow-hidden transition-all shadow-sm`}>
                                    <div className="bg-slate-50/50 px-8 py-4 flex justify-between items-center border-b border-slate-100">
                                        <div className="flex-1 flex items-center gap-3">
                                            <input 
                                                className={`bg-transparent border-none text-lg font-black focus:ring-0 w-full max-w-md ${tableDup ? 'text-rose-600' : 'text-slate-800'}`} 
                                                placeholder="Table Name (e.g. items)"
                                                value={t.tableName}
                                                onChange={(e) => setTables(tables.map(item => item.id === t.id ? {...item, tableName: e.target.value} : item))}
                                            />
                                            {tableDup && <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase"><AlertCircle size={12}/> Duplicate Table Name</span>}
                                        </div>
                                        <button onClick={() => setTables(tables.filter(item => item.id !== t.id))} className="text-slate-400 hover:text-rose-500 transition-colors">
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                    <div className="p-8">
                                        <div className="flex flex-wrap gap-3">
                                            {t.columns.map((col) => {
                                                const colDup = isFieldNameDuplicate(col.name, col.id);
                                                return (
                                                    <div key={col.id} className={`flex items-center gap-2 pl-4 pr-2 py-2 bg-slate-50 border rounded-xl group transition-all ${colDup ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-100' : 'border-slate-200 hover:border-teal-300'}`}>
                                                        <input 
                                                            className={`bg-transparent border-none text-xs font-bold focus:ring-0 w-28 ${colDup ? 'text-rose-600' : 'text-slate-600'}`} 
                                                            placeholder="Column Name" 
                                                            value={col.name}
                                                            onChange={(e) => setTables(tables.map(table => {
                                                                if(table.id === t.id) {
                                                                    return {...table, columns: table.columns.map(c => c.id === col.id ? {...c, name: e.target.value} : c)};
                                                                }
                                                                return table;
                                                            }))}
                                                        />
                                                        {colDup && <AlertCircle size={12} className="text-rose-500" />}
                                                        <button onClick={() => setTables(tables.map(table => table.id === t.id ? {...table, columns: table.columns.filter(c => c.id !== col.id)} : table))} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>
                                                    </div>
                                                );
                                            })}
                                            <button onClick={() => addColumn(t.id)} className="px-4 py-2 border-2 border-dashed border-slate-200 rounded-xl text-xs font-extrabold text-slate-400 hover:border-teal-500 hover:text-teal-500 transition-all">
                                                + Add Column
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
}