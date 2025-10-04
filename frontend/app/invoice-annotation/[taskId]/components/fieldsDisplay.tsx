import { useEffect, useState } from "react";
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
    taskDetails?: { id?: string | number };
    jsonData: any;
    setJsonData: React.Dispatch<React.SetStateAction<any>>;
    selectedElement: SelectedElement | null;
    setSelectedElement: React.Dispatch<React.SetStateAction<SelectedElement | null>>;
    handleFieldChange: (element: SelectedElement) => void;
    handleSave: () => void;
    handleReset: () => void;
    // From parent
    activeSection: string | null;
    setActiveSection: React.Dispatch<React.SetStateAction<string | null>>;
    addSection: (name: string, type: 'general' | 'table') => void;
    isTableSection?: boolean;
}

const FieldsDisplay: React.FC<FieldsDisplayProps> = ({ taskDetails, jsonData, setJsonData, selectedElement, setSelectedElement, handleFieldChange, handleSave, handleReset, activeSection, setActiveSection, addSection, isTableSection }) => {

    if (!jsonData) {
        return (
            <div className="relative inset-0 flex items-center justify-center bg-white bg-opacity-75 h-screen w-full">
                <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
            </div>
        );
    }

    const [dropDownOptions, setDropDownOptions] = useState<{ [key: string]: string[] }>({});
    const [showAddSection, setShowAddSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");
    const [newSectionType, setNewSectionType] = useState<'general' | 'table'>("general");
    // New: menus state
    const [openHeaderMenu, setOpenHeaderMenu] = useState<number | null>(null);
    const [openFieldMenu, setOpenFieldMenu] = useState<string | null>(null);

    // Determine list of tab sections (support arrays and new table objects with rows)
    const tabSections: string[] = Object.keys(jsonData).filter(k => {
        const v = jsonData[k];
        return Array.isArray(v) || (v && typeof v === 'object' && Array.isArray(v.rows));
    });

    useEffect(() => {
        fetch("/fields.json")
            .then((res) => res.json())
            .then((data) => setDropDownOptions(data))
            .catch((err) => {
                console.error("Failed to load fields.json", err);
                setDropDownOptions({});
            });
    }, []);

    // Migrate legacy table (array of arrays) to new structure { columns, rows }
    useEffect(() => {
        if (!activeSection || !isTableSection) return;
        const v = jsonData[activeSection];
        if (Array.isArray(v) && v.length > 0 && Array.isArray(v[0])) {
            const legacyRows: any[][] = v as any[][];
            const colCount = Math.max(1, ...legacyRows.map(r => Array.isArray(r) ? r.length : 0));
            const headerNames: string[] = Array.from({ length: colCount }, (_, cIdx) => {
                const firstCell = legacyRows.find(r => Array.isArray(r) && r[cIdx])?.[cIdx];
                return firstCell?.Name || "";
            });
            const columns = headerNames.map((name, idx) => ({
                id: `col-${idx}-${Date.now()}`,
                Name: name || "",
                Label: name || "",
                LabelBoundingBox: null,
                Page: 1
            }));
            const genCellId = () => `cell-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
            const rows = legacyRows.map(r => Array.from({ length: colCount }, (_, cIdx) => {
                const cell = Array.isArray(r) ? r[cIdx] : undefined;
                return {
                    id: cell?.id || genCellId(),
                    Value: {
                        Text: cell?.Value?.Text || "",
                        BoundingBox: cell?.Value?.BoundingBox || null,
                        Page: cell?.Value?.Page || 1
                    }
                };
            }));
            const newJson = { ...jsonData, [activeSection]: { columns, rows } };
            setJsonData(newJson);
        }
    }, [activeSection, isTableSection, jsonData, setJsonData]);

    const downloadJsonData = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData, null, 2));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${taskDetails?.id || "task"}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const addFieldToActive = () => {
        if (!activeSection) return;
        const sectionData = jsonData[activeSection];
        // Block for table-like sections (legacy array-of-arrays or new {rows, columns})
        if ((Array.isArray(sectionData) && sectionData.length > 0 && Array.isArray(sectionData[0])) || (sectionData && typeof sectionData === 'object' && Array.isArray(sectionData.rows))) return;
        const current = sectionData || [];
        const newId = `new-${Date.now()}`;
        const newField = {
            id: newId,
            Name: "",
            Value: {
                Label: "",
                Text: "",
                LabelBoundingBox: null,
                BoundingBox: null,
                Page: 1,
            },
        };
        const newJson = { ...jsonData };
        newJson[activeSection] = [...(current || []), newField];
        setJsonData(newJson);
        setTimeout(() => {
            const el = document.getElementById(`field-${newId}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 0);
    };

    const addRowToActive = () => {
        if (!activeSection) return;
        const sectionData = jsonData[activeSection];
        const genId = () => `cell-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const makeCell = () => ({
            id: genId(),
            Value: { Text: "", BoundingBox: null, Page: 1 }
        });

        // New table structure
        if (sectionData && typeof sectionData === 'object' && Array.isArray(sectionData.rows)) {
            const colCount = Math.max(1, sectionData.columns?.length || 0);
            const newRow = Array.from({ length: colCount || 1 }, makeCell);
            const firstCellId = newRow[0]?.id;
            const newJson = { ...jsonData };
            newJson[activeSection] = {
                ...sectionData,
                rows: [...(sectionData.rows || []), newRow]
            };
            setJsonData(newJson);
            setTimeout(() => {
                const el = document.getElementById(`field-${firstCellId}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 0);
            return;
        }

        // Legacy fallback (array of arrays)
        const current = sectionData || [];
        const colCount = Math.max(1, ...current.map((r: any) => Array.isArray(r) ? r.length : 0));
        const legacyMakeCell = () => ({
            id: genId(),
            Name: "",
            Value: { Label: "", Text: "", LabelBoundingBox: null, BoundingBox: null, Page: 1 }
        });
        const newRow = Array.from({ length: colCount }, legacyMakeCell);
        const firstCellId = newRow[0]?.id;
        const newJson = { ...jsonData };
        newJson[activeSection] = Array.isArray(current) ? [...current, newRow] : [newRow];
        setJsonData(newJson);
        setTimeout(() => {
            const el = document.getElementById(`field-${firstCellId}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 0);
    };

    // Add column adjacent to + Row (bottom bar)
    const addColumnToActive = () => {
        if (!activeSection) return;
        const sectionData = jsonData[activeSection];
        const genId = () => `cell-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

        // New table structure
        if (sectionData && typeof sectionData === 'object' && Array.isArray(sectionData.rows)) {
            const cols = Array.isArray(sectionData.columns) ? [...sectionData.columns] : [];
            cols.push({ id: `col-${cols.length}-${Date.now()}`, Name: "", Label: "", LabelBoundingBox: null, Page: 1 });
            const newRows = (sectionData.rows || []).map((row: any[]) => Array.isArray(row) ? [...row, { id: genId(), Value: { Text: "", BoundingBox: null, Page: 1 } }] : row);
            const newJson = { ...jsonData };
            newJson[activeSection] = { ...sectionData, columns: cols, rows: newRows };
            setJsonData(newJson);
            return;
        }

        // Legacy fallback (array of arrays)
        if (Array.isArray(sectionData) && sectionData.length > 0 && Array.isArray(sectionData[0])) {
            const newRows = (sectionData as any[][]).map((row: any[]) => Array.isArray(row)
                ? [...row, { id: genId(), Name: "", Value: { Label: "", Text: "", LabelBoundingBox: null, BoundingBox: null, Page: 1 } }]
                : row
            );
            const newJson = { ...jsonData };
            newJson[activeSection] = newRows;
            setJsonData(newJson);
        }
    };

    const submitNewSection = () => {
        const name = newSectionName.trim();
        if (!name) return;
        addSection(name, newSectionType);
        setShowAddSection(false);
        setNewSectionName("");
        setNewSectionType("general");
    };

    // Helper to ensure a cell exists at row/col
    const ensureCellAt = (rows: any[][], rIdx: number, cIdx: number) => {
        if (!Array.isArray(rows[rIdx])) rows[rIdx] = [];
        if (!rows[rIdx][cIdx]) {
            rows[rIdx][cIdx] = {
                id: `cell-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                Name: "",
                Value: { Label: "", Text: "", LabelBoundingBox: null, BoundingBox: null, Page: 1 }
            };
        }
    };

    const clearGeneralField = (fieldId: string) => {
        if (!activeSection) return;
        const newData = { ...jsonData };
        newData[activeSection] = (jsonData[activeSection] || []).map((f: any) =>
            String(f.id) === String(fieldId)
                ? {
                    ...f,
                    Value: {
                        ...f.Value,
                        Label: "",
                        Text: "",
                        LabelBoundingBox: null,
                        BoundingBox: null
                    }
                }
                : f
        );
        setJsonData(newData);
    };

    // Helper: auto-resize textarea to fit its content
    const autoResize = (el: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header Bar (static) */}
            <div className="flex text-sm text-ellipsis justify-between bg-slate-400 shadow items-center space-x-4">
                <div>ID:</div>
                <div className="truncate overflow-hidden text-right flex-1">{taskDetails && taskDetails.id}</div>
                <div
                    className="hover:bg-gray-200 rounded p-1 cursor-pointer"
                    title="Download JSON"
                    onClick={downloadJsonData}
                >
                    <svg className="h-5 w-5 text-black" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" />
                        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                        <polyline points="7 11 12 16 17 11" />
                        <line x1="12" y1="4" x2="12" y2="16" />
                    </svg>
                </div>
            </div>

            {/* Tabs Bar (sticky) */}
            {tabSections.length > 0 && (
                <div className="sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center gap-2 px-3 py-2 overflow-x-auto">
                    {tabSections.map((section: string) => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shadow ${activeSection === section
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            {section}
                            {Array.isArray(jsonData[section]) && jsonData[section].length > 0 && (
                                <span className="ml-2 text-xs bg-white/30 px-2 py-0.5 rounded-full">{jsonData[section].length}</span>
                            )}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowAddSection(true)}
                        className="ml-auto bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm font-semibold shadow whitespace-nowrap"
                        title="Add new section"
                    >+ Section</button>
                </div>
            )}

            {/* Scrollable content area */}
            <div className="flex-1 overflow-auto">
                {activeSection && Array.isArray(jsonData[activeSection]) && !isTableSection && (
                    <div className="space-y-2 bg-gray-100 p-2">
                        {jsonData[activeSection].map((field: any) => (
                            <div
                                key={field.id}
                                id={`field-${field.id}`}
                                className={`relative group rounded-lg shadow-md p-3 space-y-3 ${selectedElement?.id === String(field.id) ? 'border-2 border-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50 border border-gray-400'} transition duration-200 cursor-pointer`}
                            >

                                <div className="items-center gap-2">
                                    {/* Name with 3-dots menu */}
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={field.Name || ""}
                                            onChange={(e) => {
                                                const newJsonData = { ...jsonData };
                                                const newField = { ...field, Name: e.target.value };
                                                newJsonData[activeSection] = jsonData[activeSection].map((f: any) => f.id === field.id ? newField : f);
                                                setJsonData(newJsonData);
                                            }}
                                            className="bg-gradient-to-b from-white to-gray-300 p-2 outline-none border border-gray-400 focus:border-blue-400 rounded-md transition w-full shadow-sm font-medium text-gray-700"
                                        >
                                            <option value="" disabled className="text-gray-400">-- select --</option>
                                            {dropDownOptions[activeSection]?.map((option: string) => (
                                                <option key={option} value={option} className="text-gray-700">{option}</option>
                                            ))}
                                        </select>
                                        <div className="relative">
                                            <button
                                                aria-label="More"
                                                title="More"
                                                className="h-8 w-8 -mr-1 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenFieldMenu(openFieldMenu === String(field.id) ? null : String(field.id));
                                                }}
                                            >
                                                ⋮
                                            </button>
                                            {openFieldMenu === String(field.id) && (
                                                <div className="absolute right-0 mt-1 z-30 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1">
                                                    <button
                                                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
                                                        onClick={() => {
                                                            clearGeneralField(String(field.id));
                                                            setOpenFieldMenu(null);
                                                        }}
                                                    >Clear values</button>
                                                    <button
                                                        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                                        onClick={() => {
                                                            const section = activeSection;
                                                            if (!section) return;
                                                            const newJsonData = { ...jsonData };
                                                            newJsonData[section] = (newJsonData[section] || []).filter((f: any) => String(f.id) !== String(field.id));
                                                            setJsonData(newJsonData);
                                                            if (selectedElement && selectedElement.section === section && String(selectedElement.id) === String(field.id)) {
                                                                setSelectedElement(null);
                                                            }
                                                            setOpenFieldMenu(null);
                                                        }}
                                                    >Delete field</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Label */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="text"
                                            onClick={() => setSelectedElement({ section: activeSection, id: field.id, target: "Label", text: field.Value?.Label ?? "", boxLocation: { BBox: field.Value.LabelBoundingBox, Page: field.Value.Page } })}
                                            value={field.Value?.Label || ""}
                                            placeholder="label"
                                            className={`bg-white p-2 outline-none border border-gray-200 rounded-md transition w-full shadow-sm text-gray-700 ${(selectedElement?.id == field.id && selectedElement?.target == "Label") ? "border-red-400 border-2" : ""}`}
                                            onChange={(e) => {
                                                const updatedElement = selectedElement;
                                                if (updatedElement) {
                                                    updatedElement.text = e.target.value;
                                                    handleFieldChange(updatedElement);
                                                }
                                            }}
                                        />
                                        {field.Value?.LabelBoundingBox && (
                                            <button
                                                className="relative"
                                                disabled={!(selectedElement?.id == field.id && selectedElement?.target == "Label")}
                                                onClick={() => {
                                                    const updatedElement = selectedElement;
                                                    if (updatedElement) {
                                                        updatedElement.boxLocation.BBox = null;
                                                        handleFieldChange(updatedElement);
                                                    }
                                                }}
                                            >
                                                <img src="/rect.png" alt="Draw Box" className="h-5 w-6" />
                                                {(selectedElement?.id == field.id && selectedElement?.target == "Label") && <XIcon />}
                                            </button>
                                        )}
                                    </div>

                                    {/* Value */}
                                    <div className="flex items-center gap-2">
                                        <textarea
                                            ref={(el) => autoResize(el)}
                                            onInput={(e) => autoResize(e.currentTarget)}
                                            onClick={() => setSelectedElement({ section: activeSection, id: field.id, target: "Value", text: field.Value?.Text, boxLocation: { BBox: field.Value.BoundingBox, Page: field.Value.Page } })}
                                            value={field.Value?.Text || ""}
                                            placeholder="value"
                                            rows={1}
                                            style={{ whiteSpace: 'pre', overflowWrap: 'normal' }}
                                            className={`bg-white p-2 outline-none border border-gray-200 rounded-md transition w-full shadow-sm text-gray-700 overflow-x-auto overflow-y-hidden whitespace-pre resize-none ${(selectedElement?.id == field.id && selectedElement?.target == "Value") ? "border-red-400 border-2" : ""}`}
                                            onChange={(e) => {
                                                const updatedElement = selectedElement;
                                                if (updatedElement) {
                                                    updatedElement.text = e.target.value;
                                                    handleFieldChange(updatedElement);
                                                }
                                            }}
                                        />
                                        {field.Value?.BoundingBox && (
                                            <button
                                                className="relative"
                                                onClick={() => {
                                                    const updatedElement = selectedElement;
                                                    if (updatedElement) {
                                                        updatedElement.boxLocation.BBox = null;
                                                        handleFieldChange(updatedElement);
                                                    }
                                                }}
                                                disabled={!(selectedElement?.id == field.id && selectedElement?.target == "Value")}
                                            >
                                                <img src="/rect.png" alt="Draw Box" className="h-5 w-6" />
                                                {(selectedElement?.id == field.id && selectedElement?.target == "Value") && <XIcon />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Table-like section display */}
                {activeSection && isTableSection && (
                    (() => {
                        const sectionData = jsonData[activeSection];
                        // New structure rendering
                        if (sectionData && typeof sectionData === 'object' && Array.isArray(sectionData.rows)) {
                            const rows: any[][] = sectionData.rows || [];
                            const columns: any[] = sectionData.columns || [];
                            const colCount = Math.max(columns.length, ...rows.map(r => Array.isArray(r) ? r.length : 0), 1);
                            const headerNames: string[] = Array.from({ length: colCount }, (_, cIdx) => columns[cIdx]?.Name || "");
                            const headerLabels: string[] = Array.from({ length: colCount }, (_, cIdx) => columns[cIdx]?.Label || "");

                            const updateHeaderName = (cIdx: number, name: string) => {
                                const newData = { ...jsonData };
                                const sec = { ...(newData[activeSection] || {} ) } as any;
                                const newCols = Array.from({ length: colCount }, (_, i) => sec.columns?.[i] ? { ...sec.columns[i] } : { id: `col-${i}-${Date.now()}`, Name: "", Label: "", LabelBoundingBox: null, Page: 1 });
                                newCols[cIdx].Name = name;
                                // If label is empty, mirror name by default
                                if (!newCols[cIdx].Label) newCols[cIdx].Label = name;
                                sec.columns = newCols;
                                newData[activeSection] = sec;
                                setJsonData(newData);
                            };

                            const updateHeaderLabel = (cIdx: number, label: string) => {
                                const newData = { ...jsonData };
                                const sec = { ...(newData[activeSection] || {} ) } as any;
                                const newCols = Array.from({ length: colCount }, (_, i) => sec.columns?.[i] ? { ...sec.columns[i] } : { id: `col-${i}-${Date.now()}`, Name: "", Label: "", LabelBoundingBox: null, Page: 1 });
                                newCols[cIdx].Label = label;
                                sec.columns = newCols;
                                newData[activeSection] = sec;
                                setJsonData(newData);
                            };

                            const clearColumnValues = (cIdx: number) => {
                                const newData = { ...jsonData };
                                const sec = { ...(newData[activeSection] || {}) } as any;
                                const newRows = (sec.rows || []).map((row: any[]) => Array.isArray(row)
                                    ? row.map((cell: any, i: number) => i === cIdx && cell ? ({
                                        ...cell,
                                        Value: { ...cell.Value, Text: "", BoundingBox: null }
                                    }) : cell)
                                    : row
                                );
                                newData[activeSection] = { ...sec, rows: newRows };
                                setJsonData(newData);
                            };

                            const removeColumn = (cIdx: number) => {
                                const newData = { ...jsonData };
                                const sec = { ...(newData[activeSection] || {}) } as any;
                                const removedColId = sec.columns?.[cIdx]?.id;
                                const cols = Array.isArray(sec.columns) ? sec.columns.filter((_: any, i: number) => i !== cIdx) : [];
                                const newRows = (sec.rows || []).map((row: any[]) => Array.isArray(row) ? row.filter((_: any, i: number) => i !== cIdx) : row);
                                newData[activeSection] = { ...sec, columns: cols, rows: newRows };
                                // Clear selection if it belonged to a removed cell or header
                                if (selectedElement && selectedElement.section === activeSection) {
                                    const wasRemovedCell = (sec.rows || []).some((row: any[]) => Array.isArray(row) && row[cIdx]?.id === selectedElement.id);
                                    const wasRemovedHeader = removedColId && selectedElement.id === removedColId;
                                    if (wasRemovedCell || wasRemovedHeader) setSelectedElement(null);
                                }
                                setJsonData(newData);
                            };

                            const removeRow = (rowIdx: number) => {
                                const newData = { ...jsonData };
                                const sec = { ...(newData[activeSection] || {}) } as any;
                                const targetRow: any[] = Array.isArray(sec.rows?.[rowIdx]) ? sec.rows[rowIdx] : [];
                                const newRows = (sec.rows || []).filter((_: any, i: number) => i !== rowIdx);
                                newData[activeSection] = { ...sec, rows: newRows };
                                if (selectedElement && selectedElement.section === activeSection) {
                                    const ids = targetRow.filter(Boolean).map((c: any) => c?.id);
                                    if (ids.includes(selectedElement.id)) setSelectedElement(null);
                                }
                                setJsonData(newData);
                            };

                            return (
                                <div id="table-section-container" className="bg-gray-100 p-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs text-gray-600">Rows: {rows.length} • Cols: {colCount}</div>
                                    </div>
                                    <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-x-auto">
                                        <table className="min-w-max table-auto border-collapse">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {/* Actions header cell */}
                                                    <th className="w-14 border border-gray-300 px-2 py-2 text-left text-gray-500 text-xs">Actions</th>
                                                    {Array.from({ length: colCount }).map((_, cIdx) => (
                                                        <th key={`hdr-${cIdx}`} className="border border-gray-300 px-2 py-2 text-left align-top">
                                                            <div className="relative flex flex-col gap-1">
                                                                <div className="flex items-center gap-1">
                                                                    <select
                                                                        value={headerNames[cIdx] || ""}
                                                                        onChange={(e) => updateHeaderName(cIdx, e.target.value)}
                                                                        className="w-full bg-gradient-to-b from-white to-gray-200 p-1.5 pr-8 outline-none border border-gray-400 focus:border-blue-400 rounded text-sm text-gray-700"
                                                                    >
                                                                        <option value="" disabled className="text-gray-400">-- select --</option>
                                                                        {dropDownOptions[activeSection]?.map((option: string) => (
                                                                            <option key={option} value={option} className="text-gray-700">{option}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="relative">
                                                                        <button
                                                                            aria-label="More"
                                                                            title="More"
                                                                            className="h-7 w-7 -mr-1 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setOpenHeaderMenu(openHeaderMenu === cIdx ? null : cIdx);
                                                                            }}
                                                                        >
                                                                            ⋮
                                                                        </button>
                                                                        {openHeaderMenu === cIdx && (
                                                                            <div className="absolute right-0 mt-1 z-30 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1">
                                                                                <button
                                                                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
                                                                                    onClick={() => {
                                                                                        clearColumnValues(cIdx);
                                                                                        setOpenHeaderMenu(null);
                                                                                    }}
                                                                                >Clear column values</button>
                                                                                <button
                                                                                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                                                                    onClick={() => {
                                                                                        removeColumn(cIdx);
                                                                                        setOpenHeaderMenu(null);
                                                                                    }}
                                                                                >Delete column</button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="label"
                                                                        value={headerLabels[cIdx] || ""}
                                                                        onClick={() => {
                                                                            // Ensure column exists before selecting
                                                                            let col = columns[cIdx];
                                                                            if (!col) {
                                                                                const dataCopy = { ...jsonData };
                                                                                const secCopy = { ...(dataCopy[activeSection] || {}) } as any;
                                                                                const colsCopy = Array.from({ length: colCount }, (_, i) => secCopy.columns?.[i] ? { ...secCopy.columns[i] } : { id: `col-${i}-${Date.now()}`, Name: "", Label: "", LabelBoundingBox: null, Page: 1 });
                                                                                secCopy.columns = colsCopy;
                                                                                dataCopy[activeSection] = secCopy;
                                                                                setJsonData(dataCopy);
                                                                                col = colsCopy[cIdx];
                                                                            }
                                                                            if (col) {
                                                                                setSelectedElement({
                                                                                    section: activeSection!,
                                                                                    id: col.id,
                                                                                    target: "Label",
                                                                                    text: col.Label || "",
                                                                                    boxLocation: { BBox: col.LabelBoundingBox || null, Page: col.Page || 1 }
                                                                                });
                                                                            }
                                                                        }}
                                                                        onChange={(e) => updateHeaderLabel(cIdx, e.target.value)}
                                                                        className={`w-full bg-white p-1.5 outline-none border border-gray-300 focus:border-blue-400 rounded text-xs text-gray-700 ${(() => { const col = columns[cIdx]; return col && selectedElement?.id === col.id && selectedElement?.target === 'Label' ? 'border-red-400 border-2' : ''; })()}`}
                                                                    />
                                                                    {(() => { const col = columns[cIdx]; return col?.LabelBoundingBox; })() && (
                                                                        <button
                                                                            className="relative"
                                                                            disabled={(() => { const col = columns[cIdx]; return !(col && selectedElement?.id === col.id && selectedElement?.target === 'Label'); })()}
                                                                            onClick={() => {
                                                                                const col = columns[cIdx];
                                                                                if (!col) return;
                                                                                setSelectedElement(prev => prev ? { ...prev, boxLocation: { ...prev.boxLocation, BBox: null } } : prev);
                                                                                const updated = selectedElement && selectedElement.id === col.id ? { ...selectedElement, boxLocation: { ...selectedElement.boxLocation, BBox: null } } : null;
                                                                                if (updated) handleFieldChange(updated);
                                                                            }}
                                                                        >
                                                                            <img src="/rect.png" alt="Draw Box" className="h-5 w-6" />
                                                                            {(() => { const col = columns[cIdx]; return col && (selectedElement?.id === col.id && selectedElement?.target === 'Label'); })() && <XIcon />}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row: any[], rowIdx: number) => (
                                                    <tr key={`row-${rowIdx}`}>
                                                        {/* Row actions */}
                                                        <td className="border border-gray-200 px-1 py-1 align-top">
                                                            <button
                                                                aria-label="Delete row"
                                                                title="Delete row"
                                                                className="h-6 w-6 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-500 hover:text-red-600 shadow-sm"
                                                                onClick={() => removeRow(rowIdx)}
                                                            >
                                                                ×
                                                            </button>
                                                        </td>
                                                        {Array.from({ length: colCount }).map((_, cIdx) => {
                                                            const cell = Array.isArray(row) ? row[cIdx] : undefined;
                                                            return (
                                                                <td key={cell?.id || `cell-${rowIdx}-${cIdx}`} className={`border border-gray-200 px-2 py-1 align-top ${cell && selectedElement?.id === String(cell.id) ? 'bg-blue-50' : ''}`}>
                                                                    <div id={cell?.id ? `field-${cell.id}` : undefined} className="flex items-center gap-2">
                                                                        <textarea
                                                                            ref={(el) => autoResize(el)}
                                                                            onInput={(e) => autoResize(e.currentTarget)}
                                                                            onClick={() => cell && setSelectedElement({ section: activeSection, id: cell.id, target: "Value", text: cell.Value?.Text ?? "", boxLocation: { BBox: cell.Value?.BoundingBox ?? null, Page: cell.Value?.Page ?? 1 } })}
                                                                            value={cell?.Value?.Text || ""}
                                                                            placeholder="value"
                                                                            rows={1}
                                                                            style={{ whiteSpace: 'pre', overflowWrap: 'normal' }}
                                                                            className={`bg-white p-1.5 outline-none border border-gray-200 rounded text-sm w-full overflow-x-auto overflow-y-hidden whitespace-pre resize-none ${cell && (selectedElement?.id == cell.id && selectedElement?.target == "Value") ? "border-red-400 border-2" : ""}`}
                                                                            onChange={(e) => {
                                                                                const updated = { ...selectedElement } as SelectedElement | null;
                                                                                if (cell && updated && updated.id === cell.id) {
                                                                                    updated.text = e.target.value;
                                                                                    updated.boxLocation.BBox = updated.boxLocation.BBox; // unchanged
                                                                                    handleFieldChange(updated);
                                                                                }
                                                                            }}
                                                                        />
                                                                        {cell?.Value?.BoundingBox && (
                                                                            <button
                                                                                className="relative"
                                                                                disabled={!(cell && selectedElement?.id == cell.id && selectedElement?.target == "Value")}
                                                                                onClick={() => {
                                                                                    const updated = { ...selectedElement } as SelectedElement | null;
                                                                                    if (cell && updated && updated.id === cell.id) {
                                                                                        updated.boxLocation.BBox = null;
                                                                                        handleFieldChange(updated);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <img src="/rect.png" alt="Draw Box" className="h-5 w-6" />
                                                                                {cell && (selectedElement?.id == cell.id && selectedElement?.target == "Value") && <XIcon />}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        }

                        // Legacy rendering (fallback)
                        return (
                            <div id="table-section-container" className="bg-gray-100 p-2">
                                {(() => {
                                    const rows: any[][] = jsonData[activeSection] as any[][];
                                    const colCount = Math.max(1, ...rows.map(r => Array.isArray(r) ? r.length : 0));
                                    const headerNames: string[] = Array.from({ length: colCount }, (_, cIdx) => {
                                        const firstCell = rows.find(r => Array.isArray(r) && r[cIdx])?.[cIdx];
                                        return firstCell?.Name || "";
                                    });
                                    const updateHeader = (cIdx: number, name: string) => {
                                        const newData = { ...jsonData };
                                        const newRows: any[][] = (jsonData[activeSection] as any[][]).map((r: any[]) => {
                                            const rowCopy = Array.isArray(r) ? [...r] : [];
                                            if (rowCopy[cIdx]) rowCopy[cIdx] = { ...rowCopy[cIdx], Name: name };
                                            return rowCopy;
                                        });
                                        newData[activeSection] = newRows;
                                        setJsonData(newData);
                                    };
                                    return (
                                        <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-auto">
                                            <table className="w-full table-auto border-collapse">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        {Array.from({ length: colCount }).map((_, cIdx) => (
                                                            <th key={`hdr-${cIdx}`} className="border border-gray-300 px-2 py-2 text-left">
                                                                <select
                                                                    value={headerNames[cIdx] || ""}
                                                                    onChange={(e) => updateHeader(cIdx, e.target.value)}
                                                                    className="w-full bg-gradient-to-b from-white to-gray-200 p-1.5 outline-none border border-gray-400 focus:border-blue-400 rounded text-sm text-gray-700"
                                                                >
                                                                    <option value="" disabled className="text-gray-400">-- column --</option>
                                                                    {dropDownOptions[activeSection]?.map((option: string) => (
                                                                        <option key={option} value={option} className="text-gray-700">{option}</option>
                                                                    ))}
                                                                </select>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rows.map((row: any[], rowIdx: number) => (
                                                        <tr key={`row-${rowIdx}`}>
                                                            {Array.from({ length: colCount }).map((_, cIdx) => {
                                                                const cell = Array.isArray(row) ? row[cIdx] : undefined;
                                                                return (
                                                                    <td key={cell?.id || `cell-${rowIdx}-${cIdx}`} className={`border border-gray-200 px-2 py-1 align-top ${cell && selectedElement?.id === String(cell.id) ? 'bg-blue-50' : ''}`}>
                                                                        <div id={cell?.id ? `field-${cell.id}` : undefined} className="flex items-center gap-2">
                                                                            <textarea
                                                                                ref={(el) => autoResize(el)}
                                                                                onInput={(e) => autoResize(e.currentTarget)}
                                                                                onClick={() => cell && setSelectedElement({ section: activeSection, id: cell.id, target: "Value", text: cell.Value?.Text ?? "", boxLocation: { BBox: cell.Value.BoundingBox, Page: cell.Value.Page } })}
                                                                                value={cell?.Value?.Text || ""}
                                                                                placeholder="value"
                                                                                rows={1}
                                                                                style={{ whiteSpace: 'pre', overflowWrap: 'normal' }}
                                                                                className={`bg-white p-1.5 outline-none border border-gray-200 rounded text-sm w-full overflow-x-auto overflow-y-hidden whitespace-pre resize-none ${cell && (selectedElement?.id == cell.id && selectedElement?.target == "Value") ? "border-red-400 border-2" : ""}`}
                                                                                onChange={(e) => {
                                                                                    const updated = { ...selectedElement } as SelectedElement | null;
                                                                                    if (cell && updated && updated.id === cell.id) {
                                                                                        updated.text = e.target.value;
                                                                                        handleFieldChange(updated);
                                                                                    }
                                                                                }}
                                                                            />
                                                                            {cell?.Value?.BoundingBox && (
                                                                                <button
                                                                                    className="relative"
                                                                                    disabled={!(cell && selectedElement?.id == cell.id && selectedElement?.target == "Value")}
                                                                                    onClick={() => {
                                                                                        const updated = { ...selectedElement } as SelectedElement | null;
                                                                                        if (cell && updated && updated.id === cell.id) {
                                                                                            updated.boxLocation.BBox = null;
                                                                                            handleFieldChange(updated);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <img src="/rect.png" alt="Draw Box" className="h-5 w-6" />
                                                                                    {cell && (selectedElement?.id == cell.id && selectedElement?.target == "Value") && <XIcon />}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    })()
                )}
            </div>

            {/* Bottom Bar: Add Field/Row + Save/Reset */}
            <div className="bg-gradient-to-t from-white via-gray-50 to-transparent shadow-lg p-3 flex items-center justify-between gap-3 border-t border-gray-200">
                {/* Left actions */}
                {isTableSection ? (
                    <div className="flex items-center gap-2">
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow transition-colors disabled:opacity-40"
                            onClick={addRowToActive}
                            disabled={!activeSection}
                            title={'Add row to active table section'}
                        >+ Row</button>
                        <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-md shadow transition-colors disabled:opacity-40"
                            onClick={addColumnToActive}
                            disabled={!activeSection}
                            title={'Add column to active table section'}
                        >+ Column</button>
                    </div>
                ) : (
                    <button
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow transition-colors disabled:opacity-40"
                        onClick={addFieldToActive}
                        disabled={!activeSection}
                        title={'Add field to active section'}
                    >+ Field</button>
                )}

                <div className="flex gap-3">
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        onClick={handleSave}
                    >Save</button>
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-md shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
                        onClick={handleReset}
                    >Reset</button>
                </div>
            </div>

            {/* Add Section Modal */}
            {showAddSection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddSection(false)} />
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-5">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Section</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Section name</label>
                                <input
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="e.g., VendorDetails"
                                    value={newSectionName}
                                    onChange={e => setNewSectionName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Section type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            name="sectionType"
                                            checked={newSectionType === 'general'}
                                            onChange={() => setNewSectionType('general')}
                                        />
                                        General (list)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            name="sectionType"
                                            checked={newSectionType === 'table'}
                                            onChange={() => setNewSectionType('table')}
                                        />
                                        Table (rows/columns)
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                                onClick={() => setShowAddSection(false)}
                            >Cancel</button>
                            <button
                                className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-50"
                                onClick={submitNewSection}
                                disabled={!newSectionName.trim()}
                            >Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FieldsDisplay;
