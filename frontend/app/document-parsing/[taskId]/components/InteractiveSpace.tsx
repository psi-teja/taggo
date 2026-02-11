import React, { useState, useEffect } from "react";
import PdfViewer from "@/app/components/PdfViewer";
import { addIdsToJsonData, saveJsonData } from "@/app/hooks/utils";
import FieldsDisplay from "./fieldsDisplay";
import axiosInstance from "@/app/hooks/axiosInstance";
import Link from "next/link";

interface InteractiveSpaceProps {
    taskDetails: any;
    isEditor: boolean;
}

interface SelectedElement {
    section: string;
    id: string;
    target: string;
    text: string | null;
    boxLocation: {
        "BBox": {
            "left": number;
            "top": number;
            "width": number;
            "height": number;
        } | null,
        "Page": number;
    }
}

const InteractiveSpace: React.FC<InteractiveSpaceProps> = ({
    taskDetails,
    isEditor
}) => {
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [jsonData, setJsonData] = useState<any>(null);
    const [jsonNotFound, setJsonNotFound] = useState<boolean>(false);
    const [initializing, setInitializing] = useState<boolean>(false);

    // Layout states (vertical for General-like, horizontal for Table-like)
    const [leftWidth, setLeftWidth] = useState<number>(70);
    const minWidth = 20; // prevent collapsing too much
    const maxWidth = 90;
    const [topHeight, setTopHeight] = useState<number>(60);
    const minHeight = 20;
    const maxHeight = 90;

    // Active section and types
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [sectionTypes, setSectionTypes] = useState<Record<string, 'general' | 'table'>>({});
    const [schemaDefined, setSchemaDefined] = useState<boolean | null>(null);

    const jsonURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media/annotations/${taskDetails?.id}.json`;

    console.log("JSON URL:", jsonURL);

    const deriveSectionTypes = (data: any) => {
        const types: Record<string, 'general' | 'table'> = {};
        if (!data) return types;
        Object.keys(data).forEach(key => {
            const val = data[key];
            if (Array.isArray(val)) {
                // Heuristic: if first element is an array => table (legacy)
                const isTable = Array.isArray(val[0]) || key.toLowerCase().includes('table');
                types[key] = isTable ? 'table' : 'general';
            } else if (val && typeof val === 'object' && Array.isArray(val.rows)) {
                // New structure for table sections: { columns: [], rows: [] }
                types[key] = 'table';
            }
        });
        return types;
    }

    const ensureActiveSection = (data: any, current: string | null) => {
        const keys = Object.keys(data || {}).filter(k => {
            const v = data[k];
            return Array.isArray(v) || (v && typeof v === 'object' && Array.isArray(v.rows));
        });
        if (keys.length === 0) return null;
        if (current && keys.includes(current)) return current;
        return keys[0];
    }

    const fetchJsonData = async () => {
        try {
            if (!taskDetails?.id) return;
            const response = await fetch(jsonURL, { cache: 'no-store' });
            if (response.status === 404) {
                setJsonNotFound(true);
                setJsonData(null);
                return;
            }
            if (!response.ok) throw new Error("Failed to fetch JSON data");
            const data = await response.json();
            const updatedData = addIdsToJsonData(data);
            setJsonData(updatedData);
            setJsonNotFound(false);
            if (JSON.stringify(data) !== JSON.stringify(updatedData)) {
                saveJsonData(updatedData, taskDetails);
            }
            const types = deriveSectionTypes(updatedData);
            setSectionTypes(types);
            setActiveSection(prev => ensureActiveSection(updatedData, prev));
        } catch (error) {
            console.error("Error fetching JSON data:", error);
            // If any other error, treat as not found (optional) but don't overwrite existing data
            if (!jsonData) setJsonNotFound(true);
        }
    };

    const checkSchemaDefined = async () => {
        try {
            const taskType = taskDetails?.task_type || 'invoice-annotation';
            const res = await axiosInstance.get('/schema/sections', { params: { task_type: taskType } });
            const sections = res.data?.sections || [];
            setSchemaDefined(Array.isArray(sections) && sections.length > 0);
        } catch (e) {
            console.warn('Failed to check schema definition', e);
            setSchemaDefined(null);
        }
    };

    useEffect(() => {
        if (taskDetails) {
            fetchJsonData();
            checkSchemaDefined();
        }
    }, [taskDetails]);

    const handleInitializeTemplate = async () => {
        try {
            setInitializing(true);
            const taskType = taskDetails?.task_type || 'invoice-annotation';
            const res = await axiosInstance.get('/schema/sections', { params: { task_type: taskType } });
            const sections: Array<{ id: number; name: string; section_type: 'general' | 'table'; fields: Array<{ id: number; name: string }> }> = res.data?.sections || [];

            if (!sections || sections.length === 0) {
                alert('Schema is not defined. Please define it in Schema before starting annotation.');
                return;
            }

            const genId = () => `cell-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
            const now = Date.now();
            const data: any = {};

            sections.forEach((sec, idx) => {
                if (sec.section_type === 'general') {
                    data[sec.name] = [
                        {
                            Name: "",
                            Value: {
                                Label: "",
                                Text: "",
                                LabelBoundingBox: null,
                                BoundingBox: null,
                                Page: 1,
                            },
                        },
                    ];
                } else if (sec.section_type === 'table') {
                    const columns = (sec.fields || []).map((f, cIdx) => ({
                        id: `col-${idx}-${cIdx}-${now}`,
                        Name: f.name,
                        Label: "",
                        LabelBoundingBox: null,
                        Page: 1,
                    }));
                    const row = (columns.length > 0 ? columns : []).map(() => ({
                        id: genId(),
                        Value: { Text: "", BoundingBox: null, Page: 1 },
                    }));
                    data[sec.name] = { columns, rows: row.length ? [row] : [] };
                }
            });

            data["Meta"] = {
                createdAt: new Date().toISOString(),
                version: 1,
                taskId: taskDetails?.id,
            };

            const withIds = addIdsToJsonData(data);
            setJsonData(withIds);
            await saveJsonData(withIds, taskDetails);
            setJsonNotFound(false);
            const types = deriveSectionTypes(withIds);
            setSectionTypes(types);
            setActiveSection(ensureActiveSection(withIds, null));
        } catch (err) {
            console.error('Failed to initialize from schema', err);
            alert('Failed to initialize from schema. Please ensure you are logged in and schema is configured.');
        } finally {
            setInitializing(false);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const startX = e.clientX;
        const startWidth = leftWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const containerWidth = window.innerWidth;
            const deltaPercent = (deltaX / containerWidth) * 100;
            let newWidth = startWidth + deltaPercent;

            // Clamp width
            if (newWidth < minWidth) newWidth = minWidth;
            if (newWidth > maxWidth) newWidth = maxWidth;

            setLeftWidth(newWidth);
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleRowMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const startY = e.clientY;
        const startHeight = topHeight;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const containerHeight = window.innerHeight;
            const deltaPercent = (deltaY / containerHeight) * 100;
            let newHeight = startHeight + deltaPercent;
            if (newHeight < minHeight) newHeight = minHeight;
            if (newHeight > maxHeight) newHeight = maxHeight;
            setTopHeight(newHeight);
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };


    const handleFieldChange = (updatedElement: SelectedElement) => {
        setSelectedElement(updatedElement);
        const section = updatedElement.section;
        const id = updatedElement.id;
        const target = updatedElement.target;
        const text = updatedElement.text;
        const BBox = updatedElement.boxLocation.BBox;

        const newJsonData = { ...jsonData };
        const sectionData = newJsonData[section];

        if (!sectionData) return;

        // New structure: { columns: Column[], rows: Cell[][] }
        if (sectionData && typeof sectionData === 'object' && Array.isArray(sectionData.rows)) {
            const { rows = [], columns = [] } = sectionData as any;

            // Try to update a cell in rows first (for Value target)
            let cellUpdated = false;
            const newRows = rows.map((row: any[]) =>
                row.map((cell: any) => {
                    if (cell?.id === id) {
                        cellUpdated = true;
                        return {
                            ...cell,
                            Value: {
                                ...cell.Value,
                                ...(target === 'Value' ? { Text: text, BoundingBox: BBox, Page: updatedElement.boxLocation.Page } : {}),
                            }
                        };
                    }
                    return cell;
                })
            );

            // If not a cell, try update a column header (for Label target)
            let newColumns = columns;
            if (!cellUpdated && Array.isArray(columns)) {
                newColumns = columns.map((col: any) => {
                    if (col?.id === id) {
                        return {
                            ...col,
                            ...(target === 'Label' ? { Label: text, LabelBoundingBox: BBox, Page: updatedElement.boxLocation.Page } : {})
                        };
                    }
                    return col;
                });
            }

            newJsonData[section] = { ...sectionData, rows: newRows, columns: newColumns };
            setJsonData(newJsonData);
            return;
        }

        // Legacy table-like: nested arrays
        const fields = sectionData || [];
        if (Array.isArray(fields) && fields.length > 0 && Array.isArray(fields[0])) {
            newJsonData[section] = fields.map((row: any[]) =>
                row.map((cell: any) =>
                    cell.id === id
                        ? {
                            ...cell,
                            Value: {
                                ...cell.Value,
                                ...(target === "Value"
                                    ? { Text: text, BoundingBox: BBox, Page: updatedElement.boxLocation.Page }
                                    : target === "Label"
                                        ? { Label: text, LabelBoundingBox: BBox, Page: updatedElement.boxLocation.Page }
                                        : {})
                            }
                        }
                        : cell
                )
            );
        } else {
            // General-like: flat array
            newJsonData[section] = fields.map((f: any) =>
                f.id === id
                    ? {
                        ...f,
                        Value: {
                            ...f.Value,
                            ...(target === "Value"
                                ? { Text: text, BoundingBox: BBox, Page: updatedElement.boxLocation.Page }
                                : target === "Label"
                                    ? { Label: text, LabelBoundingBox: BBox, Page: updatedElement.boxLocation.Page }
                                    : {})
                        }
                    }
                    : f
            );
        }
        setJsonData(newJsonData);
    };

    const addSection = (name: string, type: 'general' | 'table') => {
        if (!jsonData) return;
        const trimmed = name.trim();
        if (!trimmed) return;
        if (jsonData[trimmed] !== undefined) {
            alert('Section already exists.');
            return;
        }
        const initialValue = type === 'table' ? { columns: [], rows: [] } : [];
        const newJson = { ...jsonData, [trimmed]: initialValue };
        setJsonData(newJson);
        setSectionTypes(prev => ({ ...prev, [trimmed]: type }));
        setActiveSection(trimmed);
    };

    const isTableSection = activeSection ? (sectionTypes[activeSection] === 'table') : false;

    const RightPanelContent = (
        jsonNotFound && !jsonData ? (
            <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 p-8 text-center">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">No existing annotation found</h2>
                {schemaDefined === false ? (
                    <>
                        <p className="text-gray-600 max-w-lg mb-6">
                            Schema is not defined for this task type. Please define sections and fields in Schema before starting annotation.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/invoice-annotation/schema" className="px-6 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold">Open Schema</Link>
                            <button
                                onClick={checkSchemaDefined}
                                className="px-5 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                                disabled={initializing}
                            >Re-check</button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-gray-600 max-w-lg mb-6">
                            Start a new annotation session. A template will be created from the schema and saved.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={fetchJsonData}
                                className="px-5 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                                disabled={initializing}
                            >Re-check</button>
                            <button
                                onClick={handleInitializeTemplate}
                                className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                                disabled={initializing}
                            >{initializing ? 'Initializing...' : 'Start Annotation'}</button>
                        </div>
                    </>
                )}
            </div>
        ) : (
            <FieldsDisplay
                taskDetails={taskDetails}
                jsonData={jsonData}
                setJsonData={setJsonData}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
                handleFieldChange={handleFieldChange}
                handleSave={() => {
                    if (jsonData) {
                        saveJsonData(jsonData, taskDetails);
                        alert("Changes saved successfully!");
                    } else {
                        alert("No data to save.");
                    }
                }}
                handleReset={() => {
                    if (jsonData) {
                        fetchJsonData();
                        alert("Changes reset to last saved state.");
                    } else {
                        alert("No data to reset.");
                    }
                }}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                addSection={addSection}
                isTableSection={isTableSection}
            />
        )
    );

    return (
        <div className={`flex h-full w-full overflow-hidden ${isTableSection ? 'flex-col' : ''}`}>
            {/* PDF panel */}
            {!isTableSection ? (
                <div style={{ width: `${leftWidth}%` }} className="h-full min-h-0">
                    <PdfViewer
                        taskDetails={taskDetails}
                        isEditor={isEditor}
                        selectedElement={selectedElement}
                        leftWidth={leftWidth}
                        handleFieldChange={handleFieldChange}
                    />
                </div>
            ) : (
                <div style={{ height: `${topHeight}%` }} className="w-full min-h-0">
                    <PdfViewer
                        taskDetails={taskDetails}
                        isEditor={isEditor}
                        selectedElement={selectedElement}
                        leftWidth={leftWidth}
                        handleFieldChange={handleFieldChange}
                    />
                </div>
            )}

            {/* Resizer */}
            {!isTableSection ? (
                <div
                    className="relative z-10 w-0.5 cursor-col-resize select-none flex items-center justify-center"
                    style={{ minWidth: "4px" }}
                    onMouseDown={(e) => {
                        // prevent text selection during drag
                        document.body.style.userSelect = "none";
                        handleMouseDown(e);
                        // restore on next mouseup anywhere
                        const restore = () => {
                            document.body.style.userSelect = "";
                            document.removeEventListener("mouseup", restore);
                        };
                        document.addEventListener("mouseup", restore);
                    }}
                    onTouchStart={(e) => {
                        // touch-based resize (mobile / tablets)
                        e.preventDefault();
                        const startX = e.touches[0].clientX;
                        const startWidth = leftWidth;
                        const containerWidth = window.innerWidth;
                        document.body.style.userSelect = "none";

                        const touchMove = (te: TouchEvent) => {
                            te.preventDefault();
                            const deltaX = te.touches[0].clientX - startX;
                            const deltaPercent = (deltaX / containerWidth) * 100;
                            let newWidth = startWidth + deltaPercent;
                            if (newWidth < minWidth) newWidth = minWidth;
                            if (newWidth > maxWidth) newWidth = maxWidth;
                            setLeftWidth(newWidth);
                        };

                        const touchEnd = () => {
                            document.removeEventListener("touchmove", touchMove);
                            document.removeEventListener("touchend", touchEnd);
                            document.body.style.userSelect = "";
                        };

                        document.addEventListener("touchmove", touchMove, { passive: false });
                        document.addEventListener("touchend", touchEnd);
                    }}
                    onDoubleClick={() => setLeftWidth(70)}
                    aria-label="Resize PDF panel"
                    role="separator"
                    aria-orientation="vertical"
                    tabIndex={0}
                    title="Drag to resize. Double-click to reset. Arrow keys to nudge."
                    onKeyDown={(e) => {
                        if (e.key === "ArrowLeft") setLeftWidth(w => Math.max(minWidth, w - 2));
                        if (e.key === "ArrowRight") setLeftWidth(w => Math.min(maxWidth, w + 2));
                        if (e.key === "Home") setLeftWidth(minWidth);
                        if (e.key === "End") setLeftWidth(maxWidth);
                    }}
                >
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* visible grip */}
                        <div className="flex flex-col gap-1 items-center justify-center pointer-events-none">
                            <span className="block w-0.5 h-4 bg-gray-400 rounded"></span>
                            <span className="block w-0.5 h-4 bg-gray-400 rounded"></span>
                            <span className="block w-0.5 h-4 bg-gray-400 rounded"></span>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className="relative z-10 h-0.5 cursor-row-resize select-none flex items-center justify-center"
                    style={{ minHeight: "4px" }}
                    onMouseDown={(e) => {
                        document.body.style.userSelect = "none";
                        handleRowMouseDown(e);
                        const restore = () => {
                            document.body.style.userSelect = "";
                            document.removeEventListener("mouseup", restore);
                        };
                        document.addEventListener("mouseup", restore);
                    }}
                    onTouchStart={(e) => {
                        // touch-based vertical resize
                        e.preventDefault();
                        const startY = e.touches[0].clientY;
                        const startHeight = topHeight;
                        const containerHeight = window.innerHeight;
                        document.body.style.userSelect = "none";

                        const touchMove = (te: TouchEvent) => {
                            te.preventDefault();
                            const deltaY = te.touches[0].clientY - startY;
                            const deltaPercent = (deltaY / containerHeight) * 100;
                            let newHeight = startHeight + deltaPercent;
                            if (newHeight < minHeight) newHeight = minHeight;
                            if (newHeight > maxHeight) newHeight = maxHeight;
                            setTopHeight(newHeight);
                        };

                        const touchEnd = () => {
                            document.removeEventListener("touchmove", touchMove);
                            document.removeEventListener("touchend", touchEnd);
                            document.body.style.userSelect = "";
                        };

                        document.addEventListener("touchmove", touchMove, { passive: false });
                        document.addEventListener("touchend", touchEnd);
                    }}
                    onDoubleClick={() => setTopHeight(60)}
                    aria-label="Resize PDF panel"
                    role="separator"
                    aria-orientation="horizontal"
                    tabIndex={0}
                    title="Drag to resize. Double-click to reset. Arrow keys to nudge."
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") setTopHeight(h => Math.max(minHeight, h - 2));
                        if (e.key === "ArrowDown") setTopHeight(h => Math.min(maxHeight, h + 2));
                        if (e.key === "Home") setTopHeight(minHeight);
                        if (e.key === "End") setTopHeight(maxHeight);
                    }}
                >
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* visible horizontal grip */}
                        <div className="flex gap-2 pointer-events-none">
                            <span className="block w-8 h-0.5 bg-gray-400 rounded"></span>
                            <span className="block w-8 h-0.5 bg-gray-400 rounded"></span>
                            <span className="block w-8 h-0.5 bg-gray-400 rounded"></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Fields panel */}
            <div className="flex-1 h-full overflow-auto min-h-0">
                {RightPanelContent}
            </div>
        </div>
    );
};

export default InteractiveSpace;
