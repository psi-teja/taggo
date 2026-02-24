"use client";
import React, { useEffect, useMemo } from "react";
import XIcon from "@/app/components/XIcon";
import { X } from "lucide-react";


interface SelectedElement {
    section: string;
    id: string;
    target: string;
    text: string | null;
    boxLocation: {
        BBox: {
            left: number;
            top: number;
            width: number;
            height: number;
        } | null;
        Page: number;
    };
}

interface FieldsDisplayProps {
    taskDetails?: { id?: string | number; task_type?: string };
    jsonData: any;
    setJsonData: React.Dispatch<React.SetStateAction<any>>;
    selectedElement: SelectedElement | null;
    setSelectedElement: React.Dispatch<React.SetStateAction<SelectedElement | null>>;
    handleFieldChange: (element: SelectedElement) => void;
    activeSection: string | null;
    setActiveSection: React.Dispatch<React.SetStateAction<string | null>>;
    isTableSection?: boolean;
    // fieldSchema now maps section -> array of schema entries { id, name }
    fieldSchema: { [key: string]: { id: string; name: string }[] };
    onDownload: () => void;
}

const FieldsDisplay: React.FC<FieldsDisplayProps> = ({
    taskDetails,
    jsonData,
    setJsonData,
    selectedElement,
    setSelectedElement,
    handleFieldChange,
    activeSection,
    setActiveSection,
    isTableSection,
    fieldSchema,
    onDownload
}) => {

    // --- Memoized used names to prevent duplicate selection ---
    const usedNames = useMemo(() => {
        if (!activeSection || !jsonData[activeSection]) return [];

        if (isTableSection) {
            // For tables, check assigned column names
            return jsonData[activeSection].columns?.map((c: any) => c.Name).filter(Boolean) || [];
        } else {
            // For general fields, check assigned field names
            return jsonData[activeSection].map((f: any) => f.Name).filter(Boolean) || [];
        }
    }, [jsonData, activeSection, isTableSection]);


    // --- Dynamic Modification Logic ---
    const addGeneralField = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeSection) return;
        const newData = { ...jsonData };
        const newField = {
            id: `node-${crypto.randomUUID()}`,
            Name: "",
            Value: { Text: "", Label: "", BoundingBox: null, LabelBoundingBox: null, Page: 1 }
        };
        newData[activeSection] = [...(jsonData[activeSection] || []), newField];
        setJsonData(newData);
    };

    const addTableColumn = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeSection || !isTableSection) return;
        const newData = { ...jsonData };
        const sec = { ...newData[activeSection] };
        const newColumn = { id: `col-${crypto.randomUUID()}`, Name: "", Label: "", LabelBoundingBox: null, Page: 1 };
        sec.columns = [...(sec.columns || []), newColumn];
        sec.rows = (sec.rows || []).map((row: any[]) => [
            ...row,
            { id: `node-${crypto.randomUUID()}`, Value: { Text: "", BoundingBox: null, Page: 1 } }
        ]);
        newData[activeSection] = sec;
        setJsonData(newData);
    };

    const deleteTableColumn = (colId: string) => {
        if (!activeSection || !isTableSection) return;
        const newData = { ...jsonData };
        const sec = { ...newData[activeSection] };
        const colIndex = sec.columns.findIndex((c: any) => c.id === colId);
        if (colIndex === -1) return;
        sec.columns = sec.columns.filter((c: any) => c.id !== colId);
        sec.rows = sec.rows.map((row: any[]) => row.filter((_, idx) => idx !== colIndex));
        newData[activeSection] = sec;
        setJsonData(newData);
    };

    const addTableRow = () => {
        if (!activeSection || !isTableSection) return;
        const newData = { ...jsonData };
        const sec = { ...newData[activeSection] };
        const newRow = sec.columns.map(() => ({
            id: `node-${crypto.randomUUID()}`,
            Value: { Text: "", BoundingBox: null, Page: 1 }
        }));
        sec.rows = [...(sec.rows || []), newRow];
        newData[activeSection] = sec;
        setJsonData(newData);
    };

    const deleteTableRow = (rIdx: number) => {
        if (!activeSection || !isTableSection) return;
        const newData = { ...jsonData };
        const sec = { ...newData[activeSection] };
        sec.rows = sec.rows.filter((_: any, idx: number) => idx !== rIdx);
        newData[activeSection] = sec;
        setJsonData(newData);
    };

    const autoResize = (el: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    useEffect(() => {
        document.querySelectorAll('textarea').forEach(el => autoResize(el as HTMLTextAreaElement));
    }, [selectedElement, jsonData]);

    const removeBoundingBox = (e: React.MouseEvent, element: SelectedElement) => {
        e.stopPropagation();
        const updated = { ...element, boxLocation: { ...element.boxLocation, BBox: null } };
        handleFieldChange(updated);
    };

    if (!jsonData) return (
        <div className="p-10 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    const tabSections: string[] = Object.keys(jsonData || {}).filter(k => k !== "Meta");

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* STICKY HEADER 1: Tabs + Task ID */}
            <div className="flex text-sm text-ellipsis justify-between bg-slate-400 shadow items-center space-x-4">
                <div>ID:</div>
                <div className="truncate overflow-hidden text-left flex-1">{taskDetails && taskDetails.id}</div>
                <div
                    className="hover:bg-gray-200 rounded p-1 cursor-pointer"
                    title="Download JSON"
                    onClick={onDownload}
                >
                    <svg className="h-5 w-5 text-black" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" />
                        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                        <polyline points="7 11 12 16 17 11" />
                        <line x1="12" y1="4" x2="12" y2="16" />
                    </svg>
                </div>
            </div>
            <div className="sticky top-0 z-30 flex items-center justify-between p-2 bg-white border-b border-gray-200 shadow-sm h-[48px]">
                <div className="flex gap-1 overflow-x-auto no-scrollbar pr-4">
                    {tabSections.map(section => (
                        <div key={section} className="flex items-center group">
                            <button
                                onClick={() => setActiveSection(section)}
                                className={`px-3 py-1.5 rounded-l-md text-xs font-bold whitespace-nowrap transition-all ${activeSection === section
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                {section}
                            </button>
                            <button
                                title={isTableSection ? "Add Column" : "Add Field"}
                                onClick={(e) => {
                                    if (activeSection !== section) setActiveSection(section);
                                    isTableSection ? addTableColumn(e) : addGeneralField(e);
                                }}
                                className={`px-2 py-1.5 rounded-r-md text-xs font-bold border-l border-white/20 transition-all ${activeSection === section
                                    ? 'bg-blue-700 text-white hover:bg-blue-800'
                                    : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                                    }`}
                            >
                                +
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-3">
                {/* 1. SINGULAR FIELDS VIEW */}
                {activeSection && Array.isArray(jsonData[activeSection]) && !isTableSection && (
                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto pb-10">
                        {jsonData[activeSection].map((field: any) => {
                            const isSelected = selectedElement?.id === String(field.id);
                            return (
                                <div key={field.id} className={`p-4 rounded-xl border-2 bg-white transition-all shadow-sm ${isSelected ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-200'}`}>
                                    <div className="mb-3">
                                        <select
                                            value={field.Name || ""}
                                            onChange={(e) => {
                                                const newData = { ...jsonData };
                                                newData[activeSection] = jsonData[activeSection].map((f: any) => f.id === field.id ? { ...f, Name: e.target.value } : f);
                                                setJsonData(newData);
                                            }}
                                            className="text-[11px] font-black tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md outline-none border border-blue-100 cursor-pointer"
                                        >
                                            <option value="">Choose Field Name...</option>
                                            {fieldSchema[activeSection]?.map(opt => (
                                                <option
                                                    key={opt.id}
                                                    value={opt.id}
                                                    disabled={usedNames.includes(opt.id) && field.Name !== opt.id}
                                                >
                                                    {opt.name} {usedNames.includes(opt.id) && field.Name !== opt.id ? "(In Use)" : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* ... rest of singular field UI */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <label className="text-[9px] text-gray-400 font-black uppercase ml-1">Label</label>
                                                <textarea
                                                    rows={1}
                                                    value={field.Value?.Label || ""}
                                                    className={`w-full p-2 text-sm border rounded-lg outline-none resize-none overflow-hidden whitespace-pre-wrap ${isSelected && selectedElement?.target === 'Label' ? 'border-red-400 ring-2 ring-red-50' : 'border-gray-100 bg-slate-50/50'}`}
                                                    onClick={() => setSelectedElement({ section: activeSection, id: field.id, target: "Label", text: field.Value?.Label, boxLocation: { BBox: field.Value.LabelBoundingBox, Page: field.Value.Page } })}
                                                    onChange={(e) => isSelected && selectedElement?.target === 'Label' && handleFieldChange({ ...selectedElement, text: e.target.value })}
                                                />
                                            </div>
                                            {field.Value?.LabelBoundingBox && (
                                                <button className="relative mt-4" onClick={(e) => isSelected && selectedElement?.target === 'Label' && removeBoundingBox(e, selectedElement)}>
                                                    <img src="/rect.png" alt="Box" className="h-4 w-4" />
                                                    {isSelected && selectedElement?.target === 'Label' && <XIcon />}
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <div className="flex-1">
                                                <label className="text-[9px] text-gray-400 font-black uppercase ml-1">Value</label>
                                                <textarea
                                                    rows={1}
                                                    value={field.Value?.Text || ""}
                                                    className={`w-full p-2 text-sm border rounded-lg outline-none resize-none overflow-hidden whitespace-pre-wrap ${isSelected && selectedElement?.target === 'Value' ? 'border-red-400 ring-2 ring-red-50' : 'border-gray-100 bg-slate-50/50'}`}
                                                    onClick={() => setSelectedElement({ section: activeSection, id: field.id, target: "Value", text: field.Value?.Text, boxLocation: { BBox: field.Value.BoundingBox, Page: field.Value.Page } })}
                                                    onChange={(e) => isSelected && selectedElement?.target === 'Value' && handleFieldChange({ ...selectedElement, text: e.target.value })}
                                                />
                                            </div>
                                            {field.Value?.BoundingBox && (
                                                <button className="relative mt-5" onClick={(e) => isSelected && selectedElement?.target === 'Value' && removeBoundingBox(e, selectedElement)}>
                                                    <img src="/rect.png" alt="Box" className="h-4 w-4" />
                                                    {isSelected && selectedElement?.target === 'Value' && <XIcon />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 2. TABLE VIEW */}
                {activeSection && isTableSection && jsonData[activeSection]?.rows && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl flex flex-col mb-10 overflow-hidden" style={{ maxHeight: '70vh' }}>

                        {/* WRAPPER FOR HORIZONTAL SCROLL */}
                        <div className="overflow-x-auto overflow-y-hidden border-b border-gray-200 bg-slate-50">
                            <table className="w-full text-left border-separate border-spacing-0 min-w-max">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="sticky left-0 z-50 p-2 w-10 border-r border-b border-gray-200 bg-slate-100"></th>
                                        {jsonData[activeSection].columns.map((col: any) => (
                                            <th key={col.id} className="sticky p-3 border-r border-b border-gray-200 min-w-[200px] relative group bg-slate-50">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-center mr-4">
                                                        <select
                                                            value={col.Name || ""}
                                                            onChange={(e) => {
                                                                const newData = { ...jsonData };
                                                                newData[activeSection].columns = newData[activeSection].columns.map((c: any) => c.id === col.id ? { ...c, Name: e.target.value } : c);
                                                                setJsonData(newData);
                                                            }}
                                                            className="text-[10px] font-bold text-slate-500 bg-transparent outline-none max-w-[140px] cursor-pointer"
                                                        >
                                                            <option value="">Column Schema...</option>
                                                            {fieldSchema[activeSection]?.map(opt => (
                                                                <option key={opt.id} value={opt.id} disabled={usedNames.includes(opt.id) && col.Name !== opt.id}>
                                                                    {opt.name} {usedNames.includes(opt.id) && col.Name !== opt.id ? "✓" : ""}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {col.LabelBoundingBox && (
                                                            <button
                                                                className="relative"
                                                                onClick={(e: React.MouseEvent) => {
                                                                    e.stopPropagation();
                                                                    const sel: SelectedElement = {
                                                                        section: activeSection as string,
                                                                        id: col.id,
                                                                        target: "Label",
                                                                        text: col.Label,
                                                                        boxLocation: { BBox: col.LabelBoundingBox, Page: col.Page }
                                                                    };
                                                                    // If already selected on this column label, remove the bounding box, otherwise select it
                                                                    if (selectedElement?.id === col.id && selectedElement?.target === 'Label') {
                                                                        removeBoundingBox(e, selectedElement);
                                                                    } else {
                                                                        setSelectedElement(sel);
                                                                    }
                                                                }}
                                                            >
                                                                <img src="/rect.png" alt="Box" className="h-4 w-4" />
                                                                {selectedElement?.id === col.id && selectedElement?.target === 'Label' && <XIcon />}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={col.Label || ""}
                                                        placeholder="Header Label"
                                                        className="text-xs p-1.5 border border-gray-200 rounded-md outline-none bg-white"
                                                        onClick={(e) => setSelectedElement({ section: activeSection, id: col.id, target: "Label", text: col.Label, boxLocation: { BBox: col.LabelBoundingBox, Page: col.Page } })}
                                                        onChange={(e) => {
                                                            const newData = { ...jsonData };
                                                            newData[activeSection].columns = newData[activeSection].columns.map((c: any) => c.id === col.id ? { ...c, Label: e.target.value } : c);
                                                            setJsonData(newData);
                                                        }}
                                                    />
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {jsonData[activeSection].rows.map((row: any[], rIdx: number) => (
                                        <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors group/row">
                                            {/* Sticky Index Column */}
                                            <td className="sticky left-0 z-10 p-2 text-[10px] font-bold text-gray-400 text-center border-r border-b border-gray-200 bg-slate-50 w-10">
                                                {rIdx + 1}
                                                <button
                                                    onClick={() => deleteTableRow(rIdx)}
                                                    className="absolute inset-0 flex items-center justify-center bg-red-50 opacity-0 group-hover/row:opacity-100 text-red-500 transition-opacity"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                            {row.map((cell: any) => {
                                                const isCellSelected = selectedElement?.id === cell.id;
                                                return (
                                                    <td key={cell.id} className="p-1 border-r border-b border-gray-100 min-w-[200px] relative group">
                                                        <textarea
                                                            rows={1}
                                                            value={cell.Value?.Text || ""}
                                                            className={`w-full p-2 text-xs bg-transparent outline-none resize-none overflow-hidden transition-all ${isCellSelected ? 'bg-blue-50/50 ring-2 ring-inset ring-blue-200 rounded-md' : ''}`}
                                                            onClick={() => setSelectedElement({ section: activeSection, id: cell.id, target: "Value", text: cell.Value?.Text, boxLocation: { BBox: cell.Value.BoundingBox, Page: cell.Value.Page } })}
                                                            onChange={(e) => isCellSelected && selectedElement && handleFieldChange({ ...selectedElement, text: e.target.value })}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* FOOTER ACTION */}
                        <button
                            onClick={addTableRow}
                            className="w-full p-3 text-[11px] font-black text-blue-600 hover:bg-blue-50 border-t border-gray-200 uppercase tracking-tighter bg-white sticky bottom-0 z-20"
                        >
                            + Add New Row
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FieldsDisplay;