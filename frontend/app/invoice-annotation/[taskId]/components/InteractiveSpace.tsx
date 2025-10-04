import React, { useState, useEffect } from "react";
import PdfViewer from "@/app/components/PdfViewer";
import { addIdsToJsonData, saveJsonData } from "@/app/hooks/utils";
import FieldsDisplay from "./fieldsDisplay";

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

    const jsonURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media/invoice-annotation/annotations/${taskDetails?.id}.json`;

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

    useEffect(() => {
        if (taskDetails) {
            fetchJsonData();
        }
    }, [taskDetails]);

    const handleInitializeTemplate = () => {
        setInitializing(true);
        const defaultTemplate = {
            General: [{
                "Name": "",
                "Value": {
                    "Text": "",
                    "BoundingBox": null,
                    "Page": 1
                }
            }],
            Table: [[{
                "Name": "",
                "Value": {
                    "Text": "",
                    "BoundingBox": null,
                    "Page": 1
                }
            }, {
                "Name": "",
                "Value": {
                    "Text": "",
                    "BoundingBox": null,
                    "Page": 1
                }
            }],[{
                "Name": "",
                "Value": {
                    "Text": "",
                    "BoundingBox": null,
                    "Page": 1
                }
            },{
                "Name": "",
                "Value": {
                    "Text": "",
                    "BoundingBox": null,
                    "Page": 1
                }
            }]],
            Meta: {
                createdAt: new Date().toISOString(),
                version: 1,
                taskId: taskDetails?.id
            }
        };
        const withIds = addIdsToJsonData(defaultTemplate);
        setJsonData(withIds);
        saveJsonData(withIds, taskDetails);
        setJsonNotFound(false);
        // set types and active section
        const types = deriveSectionTypes(withIds);
        setSectionTypes(types);
        setActiveSection(ensureActiveSection(withIds, null));
        setInitializing(false);
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
                <p className="text-gray-600 max-w-lg mb-6">
                    Start a new annotation session. A default template will be created and saved.
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
                    className="relative z-10 w-2 cursor-col-resize group border-x border-gray-500 bg-gray-200"
                    style={{ minWidth: "1px" }}
                    onMouseDown={handleMouseDown}
                    aria-label="Resize panel"
                    role="separator"
                    tabIndex={0}
                    onKeyDown={e => {
                        if (e.key === "ArrowLeft") setLeftWidth(w => Math.max(minWidth, w - 2));
                        if (e.key === "ArrowRight") setLeftWidth(w => Math.min(maxWidth, w + 2));
                    }}
                >
                    <div className="absolute inset-0 bg-gray-300 transition-colors hover:bg-blue-400" />
                </div>
            ) : (
                <div
                    className="relative z-10 h-2 cursor-row-resize group border-y border-gray-500 bg-gray-200"
                    style={{ minHeight: "1px" }}
                    onMouseDown={handleRowMouseDown}
                    aria-label="Resize panel"
                    role="separator"
                    tabIndex={0}
                    onKeyDown={e => {
                        if (e.key === "ArrowUp") setTopHeight(h => Math.max(minHeight, h - 2));
                        if (e.key === "ArrowDown") setTopHeight(h => Math.min(maxHeight, h + 2));
                    }}
                >
                    <div className="absolute inset-0 bg-gray-300 transition-colors hover:bg-blue-400" />
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
