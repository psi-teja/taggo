"use client";
import React, { useState, useEffect } from "react";
import PdfViewer from "@/app/components/PdfViewer";
import { addIdsToJsonData, saveJsonData } from "@/app/hooks/utils";
import FieldsDisplay from "./FieldsDisplay";
import axiosInstance from "@/app/hooks/axiosInstance";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
        BBox: {
            left: number;
            top: number;
            width: number;
            height: number;
        } | null;
        Page: number;
    };
}

const InteractiveSpace: React.FC<InteractiveSpaceProps> = ({
    taskDetails,
    isEditor
}) => {
    const router = useRouter();
    // Data & Selection States
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [jsonData, setJsonData] = useState<any>(null);
    const [fieldSchema, setFieldSchema] = useState<{ [key: string]: { id: string; name: string }[] }>({});
    
    // Status States
    const [jsonNotFound, setJsonNotFound] = useState<boolean>(false);
    const [initializing, setInitializing] = useState<boolean>(false);
    const [schemaDefined, setSchemaDefined] = useState<boolean | null>(null);

    // Layout states
    const [leftWidth, setLeftWidth] = useState<number>(70);
    const [topHeight, setTopHeight] = useState<number>(60);
    const minWidth = 20; 
    const maxWidth = 90;
    const minHeight = 20;
    const maxHeight = 90;

    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [sectionTypes, setSectionTypes] = useState<Record<string, 'singular' | 'table'>>({});

    const jsonURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media/${taskDetails?.project_id}/annotations/${taskDetails?.id}.json`;

    // --- Data Fetching & Schema Logic ---

    const deriveSectionTypes = (data: any) => {
        const types: Record<string, 'singular' | 'table'> = {};
        if (!data) return types;
        Object.keys(data).forEach(key => {
            if (key === "Meta") return;
            const val = data[key];
            const isTable = (val && typeof val === 'object' && Array.isArray(val.rows)) || 
                            (Array.isArray(val) && Array.isArray(val[0]));
            types[key] = isTable ? 'table' : 'singular';
        });
        return types;
    };

    const ensureActiveSection = (data: any, current: string | null) => {
        const keys = Object.keys(data || {}).filter(k => k !== "Meta");
        if (keys.length === 0) return null;
        if (current && keys.includes(current)) return current;
        return keys[0];
    };

    const downloadJsonData = () => {
    const data = jsonData || { Objects: [] };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${taskDetails?.id || "task"}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

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
            setSectionTypes(deriveSectionTypes(updatedData));
            setActiveSection(prev => ensureActiveSection(updatedData, prev));
        } catch (error) {
            console.error("Error fetching JSON data:", error);
            if (!jsonData) setJsonNotFound(true);
        }
    };

    const loadSchemaOptions = async () => {
        try {
            const projectId = taskDetails?.project_id || taskDetails?.project;
            if (!projectId) return;

            const res = await axiosInstance.get(`/projects/${projectId}/`);
            const schema = res.data?.schema;

            if (schema) {
                const options: { [key: string]: { id: string; name: string }[] } = {};
                if (schema.fields) options['Singular'] = schema.fields.map((f: any) => ({ id: f.id, name: f.name }));
                schema.tables?.forEach((t: any) => {
                    options[t.tableName] = t.columns.map((c: any) => ({ id: c.id, name: c.name }));
                });
                setFieldSchema(options);
                setSchemaDefined((schema.fields?.length > 0) || (schema.tables?.length > 0));
            } else {
                setSchemaDefined(false);
            }
        } catch (e) {
            console.error("Error loading project schema:", e);
            setSchemaDefined(false);
        }
    };

    useEffect(() => {
        if (taskDetails) {
            fetchJsonData();
            loadSchemaOptions();
        }
    }, [taskDetails]);

    // --- Initialization Logic ---

    const handleInitializeTemplate = async () => {
        try {
            setInitializing(true);
            const projectId = taskDetails?.project_id || taskDetails?.project;
            const res = await axiosInstance.get(`/projects/${projectId}/`);
            const schema = res.data?.schema;
            
            if (!schema || (!schema.fields?.length && !schema.tables?.length)) {
                alert('Schema is empty. Please define it first.');
                return;
            }

            const genId = () => `node-${crypto.randomUUID()}`;
            const data: any = {};

            if (schema.fields?.length > 0) {
                data['Singular'] = schema.fields.map((f: any) => ({
                    id: genId(),
                    Name: f.id,
                    Value: { Label: '', Text: '', LabelBoundingBox: null, BoundingBox: null, Page: 1 }
                }));
            }

            schema.tables?.forEach((t: any) => {
                const columns = (t.columns || []).map((col: any, cIdx: number) => ({
                    id: `col-${crypto.randomUUID()}`,
                    Name: col.id,
                    Label: '',
                    LabelBoundingBox: null,
                    Page: 1,
                }));
                const firstRow = columns.map(() => ({
                    id: genId(),
                    Value: { Text: '', BoundingBox: null, Page: 1 },
                }));
                data[t.tableName || 'Table'] = { columns, rows: [firstRow] };
            });

            data['Meta'] = { createdAt: new Date().toISOString(), version: 1, taskId: taskDetails?.id };
            const withIds = addIdsToJsonData(data);
            setJsonData(withIds);
            await saveJsonData(withIds, taskDetails);
            setJsonNotFound(false);
            setSectionTypes(deriveSectionTypes(withIds));
            setActiveSection(ensureActiveSection(withIds, null));
        } catch (err) {
            alert('Failed to initialize template.');
        } finally {
            setInitializing(false);
        }
    };

    // --- Event Handlers (Preserved) ---

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const startX = e.clientX;
        const startWidth = leftWidth;
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaPercent = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
            setLeftWidth(Math.min(Math.max(startWidth + deltaPercent, minWidth), maxWidth));
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
            const deltaPercent = ((moveEvent.clientY - startY) / window.innerHeight) * 100;
            setTopHeight(Math.min(Math.max(startHeight + deltaPercent, minHeight), maxHeight));
        };
        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleFieldChange = (updated: SelectedElement) => {
        setJsonData((prev: any) => {
            const newData = { ...prev };
            const sectionData = newData[updated.section];

            if (Array.isArray(sectionData)) {
                newData[updated.section] = sectionData.map((field: any) => {
                    if (String(field.id) === updated.id) {
                        const newValue = { ...field.Value };
                        if (updated.target === "Label") {
                            newValue.Label = updated.text;
                            newValue.LabelBoundingBox = updated.boxLocation.BBox;
                            newValue.Page = updated.boxLocation.Page;
                        } else {
                            newValue.Text = updated.text;
                            newValue.BoundingBox = updated.boxLocation.BBox;
                            newValue.Page = updated.boxLocation.Page;
                        }
                        return { ...field, Value: newValue };
                    }
                    return field;
                });
            } else if (sectionData && typeof sectionData === 'object') {
                if (updated.target === "Label") {
                    sectionData.columns = sectionData.columns.map((col: any) => {
                        if (String(col.id) === updated.id) {
                            return { ...col, Label: updated.text, LabelBoundingBox: updated.boxLocation.BBox, Page: updated.boxLocation.Page};
                        }
                        return col;
                    });
                } else {
                    sectionData.rows = sectionData.rows.map((row: any[]) =>
                        row.map((cell: any) => {
                            if (String(cell.id) === updated.id) {
                                return {
                                    ...cell,
                                    Value: { ...cell.Value, Text: updated.text, BoundingBox: updated.boxLocation.BBox, Page: updated.boxLocation.Page}
                                };
                            }
                            return cell;
                        })
                    );
                }
            }
            return newData;
        });
        setSelectedElement(updated);
    };

    const isTableSection = activeSection ? (sectionTypes[activeSection] === 'table') : false;

    return (
        <div className={`flex h-full w-full overflow-hidden ${isTableSection ? 'flex-col' : ''}`}>
            {/* PDF Panel */}
            <div style={isTableSection ? { height: `${topHeight}%` } : { width: `${leftWidth}%` }} className="min-h-0 bg-slate-100">
                <PdfViewer
                    taskDetails={taskDetails}
                    isEditor={isEditor}
                    selectedElement={selectedElement}
                    leftWidth={leftWidth}
                    handleFieldChange={handleFieldChange}
                />
            </div>

            {/* Resizer */}
            <div
                className={`relative z-10 bg-slate-200 hover:bg-teal-400 transition-colors ${isTableSection ? 'h-1.5 w-full cursor-row-resize' : 'w-1.5 h-full cursor-col-resize'}`}
                onMouseDown={isTableSection ? handleRowMouseDown : handleMouseDown}
            />

            {/* Right Panel: Fields + Sticky Buttons */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                {jsonNotFound && !jsonData ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
                        <h2 className="text-xl font-bold mb-4 text-slate-700">No annotation found</h2>
                        {schemaDefined ? (
                            <button onClick={handleInitializeTemplate} className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold shadow-md hover:bg-teal-700 transition-all">
                                {initializing ? 'Initializing...' : 'Start Annotation'}
                            </button>
                        ) : (
                            <Link href={`/${taskDetails?.type}/schema/${taskDetails?.project_id}`} className="text-teal-600 font-bold hover:underline">
                                Define Project Schema First
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-auto bg-slate-50">
                            <FieldsDisplay
                                taskDetails={taskDetails}
                                jsonData={jsonData}
                                setJsonData={setJsonData}
                                selectedElement={selectedElement}
                                setSelectedElement={setSelectedElement}
                                handleFieldChange={handleFieldChange}
                                activeSection={activeSection}
                                setActiveSection={setActiveSection}
                                isTableSection={isTableSection}
                                fieldSchema={fieldSchema} 
                                onDownload={downloadJsonData}
                            />
                        </div>

                        {/* Fixed Bottom Action Bar */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                            <button 
                                onClick={fetchJsonData} 
                                className="px-5 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded hover:bg-gray-200 transition-colors uppercase tracking-wider border border-gray-200"
                            >
                                Reset
                            </button>
                            
                            <div className="flex-1 flex gap-2">
                                <button 
                                    onClick={() => { saveJsonData(jsonData, taskDetails); alert("Saved!"); }} 
                                    className="flex-1 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded shadow hover:bg-teal-700 transition-colors uppercase tracking-wider"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={async () => {
                                        await saveJsonData(jsonData, taskDetails);
                                        await axiosInstance.put(`/tasks/update/${taskDetails.id}/`, { status: 'labelled' });
                                        try {
                                            const response = await axiosInstance.get(`/projects/${taskDetails.project_id}/next_task/`);
                                            if (response.data.next_task_id) {
                                                router.push(`/document-parsing/${response.data.next_task_id}`);
                                            } else {
                                                // This else block might not be reached if the API returns 404
                                                alert("No more tasks available.");
                                                router.push(`/dashboard/${taskDetails.project_id}`);
                                            }
                                        } catch (error: any) {
                                            if (error.response && error.response.status === 404) {
                                                alert("No more tasks available.");
                                            } else {
                                                alert("Could not find next task.");
                                            }
                                            router.push(`/dashboard/${taskDetails.project_id}`);
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded shadow hover:bg-blue-700 transition-colors uppercase tracking-wider"
                                >
                                    Save and Next
                                </button>
                                
                                {/* <button 
                                    onClick={() => { saveJsonData(jsonData, taskDetails); alert("Submitted!"); }} 
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded shadow hover:bg-indigo-700 transition-colors uppercase tracking-wider"
                                >
                                    Submit
                                </button> */}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default InteractiveSpace;