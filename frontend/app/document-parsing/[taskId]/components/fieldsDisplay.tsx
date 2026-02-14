"use client";
import React, { useEffect } from "react";
import XIcon from "@/app/components/XIcon";

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
    fieldSchema: { [key: string]: string[] }; 
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
    fieldSchema
}) => {

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
            { id: `cell-${crypto.randomUUID()}`, Value: { Text: "", BoundingBox: null, Page: 1 } }
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
            id: `cell-${crypto.randomUUID()}`,
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
            {/* STICKY HEADER: Tabs + Task ID */}
            <div className="sticky top-0 z-30 flex items-center justify-between p-2 bg-white border-b border-gray-200 shadow-sm">
                {/* Tabs Container */}
                <div className="flex gap-1 overflow-x-auto no-scrollbar pr-4">
                    {tabSections.map(section => (
                        <div key={section} className="flex items-center group">
                            <button
                                onClick={() => setActiveSection(section)}
                                className={`px-3 py-1.5 rounded-l-md text-xs font-bold whitespace-nowrap transition-all ${
                                    activeSection === section 
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
                                className={`px-2 py-1.5 rounded-r-md text-xs font-bold border-l border-white/20 transition-all ${
                                    activeSection === section 
                                    ? 'bg-blue-700 text-white hover:bg-blue-800' 
                                    : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                                }`}
                            >
                                +
                            </button>
                        </div>
                    ))}
                </div>

                {/* Task ID Badge */}
                <div className="flex-shrink-0 px-2.5 py-1 bg-slate-100 rounded border border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-slate-500 tracking-tighter">
                        ID: {taskDetails?.id || "N/A"}
                    </span>
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
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
                                            className="text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md outline-none border border-blue-100"
                                        >
                                            <option value="">Choose Field Name...</option>
                                            {fieldSchema[activeSection]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>

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
    <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden mb-10">
        <table className="w-full text-left border-collapse min-w-max">
            {/* We add 'sticky' to the thead. 
                top-[49px] accounts for the height of the Tabs/ID bar.
                z-10 ensures it stays above the table body cells.
            */}
            <thead className="sticky top-[0px] z-10 bg-slate-50 border-b border-gray-200 shadow-sm">
                <tr>
                    <th className="p-2 w-8 border-r border-gray-200 bg-slate-50"></th>
                    {jsonData[activeSection].columns.map((col: any) => {
                        const isHdrSelected = selectedElement?.id === col.id;
                        return (
                            <th key={col.id} className="p-3 border-r border-gray-200 min-w-[200px] relative group bg-slate-50">
                                <button 
                                    onClick={() => deleteTableColumn(col.id)}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 text-[10px]"
                                >
                                    ✕
                                </button>
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center mr-4">
                                        <select
                                            value={col.Name || ""}
                                            onChange={(e) => {
                                                const newData = { ...jsonData };
                                                newData[activeSection].columns = newData[activeSection].columns.map((c: any) => c.id === col.id ? { ...c, Name: e.target.value } : c);
                                                setJsonData(newData);
                                            }}
                                            className="text-[10px] font-bold text-slate-500 bg-transparent outline-none max-w-[140px]"
                                        >
                                            <option value="">Column Schema...</option>
                                            {fieldSchema[activeSection]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                        {col.LabelBoundingBox && (
                                            <button className="relative" onClick={(e) => isHdrSelected && selectedElement && removeBoundingBox(e, selectedElement)}>
                                                <img src="/rect.png" alt="Box" className="h-3 w-3" />
                                                {isHdrSelected && <XIcon />}
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        type="text"
                                        value={col.Label || ""}
                                        placeholder="Header Label"
                                        className={`text-xs p-1.5 border rounded-md outline-none bg-white ${isHdrSelected ? 'border-red-400 ring-2 ring-red-50' : 'border-gray-200'}`}
                                        onClick={() => setSelectedElement({ section: activeSection, id: col.id, target: "Label", text: col.Label, boxLocation: { BBox: col.LabelBoundingBox, Page: col.Page || 1 } })}
                                        onChange={(e) => isHdrSelected && selectedElement && handleFieldChange({ ...selectedElement, text: e.target.value })}
                                    />
                                </div>
                            </th>
                        );
                    })}
                </tr>
            </thead>
                            <tbody>
                                {jsonData[activeSection].rows.map((row: any[], rIdx: number) => (
                                    <tr key={rIdx} className="border-b border-gray-100 hover:bg-slate-50/50 transition-colors group/row">
                                        <td className="p-2 text-[10px] font-bold text-gray-300 text-center border-r border-gray-200 relative">
                                            {rIdx + 1}
                                            <button 
                                                onClick={() => deleteTableRow(rIdx)}
                                                className="absolute left-0 top-0 bottom-0 px-1 opacity-0 group-hover/row:opacity-100 text-red-400 hover:bg-red-50"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                        {row.map((cell: any) => {
                                            const isCellSelected = selectedElement?.id === cell.id;
                                            return (
                                                <td key={cell.id} className="p-1 border-r border-gray-100 relative group">
                                                    <div className="flex flex-col relative">
                                                        {cell.Value?.BoundingBox && (
                                                            <div className="absolute top-1 right-1 z-10">
                                                                <button onClick={(e) => isCellSelected && selectedElement && removeBoundingBox(e, selectedElement)} className="relative">
                                                                    <img src="/rect.png" alt="Box" className="h-3 w-3 opacity-40 group-hover:opacity-100" />
                                                                    {isCellSelected && <XIcon />}
                                                                </button>
                                                            </div>
                                                        )}
                                                        <textarea
                                                            rows={1}
                                                            value={cell.Value?.Text || ""}
                                                            className={`w-full p-2 text-xs bg-transparent outline-none resize-none overflow-hidden whitespace-pre-wrap transition-all ${isCellSelected ? 'bg-blue-50/50 ring-2 ring-inset ring-blue-200 rounded-md shadow-inner' : ''}`}
                                                            onClick={() => setSelectedElement({ section: activeSection, id: cell.id, target: "Value", text: cell.Value?.Text, boxLocation: { BBox: cell.Value.BoundingBox, Page: cell.Value.Page } })}
                                                            onChange={(e) => isCellSelected && selectedElement && handleFieldChange({ ...selectedElement, text: e.target.value })}
                                                        />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button 
                            onClick={addTableRow}
                            className="w-full p-3 text-[11px] font-black text-blue-600 hover:bg-blue-50 border-t border-gray-200 uppercase tracking-tighter transition-colors"
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