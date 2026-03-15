"use client";
import React, { useState, useEffect } from "react";
import PdfViewer from "@/app/components/PdfViewer";
import { addIdsToJsonData, saveJsonData } from "@/app/hooks/utils";
import FieldsDisplay from "./FieldsDisplay";
import axiosInstance from "@/app/hooks/axiosInstance";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InteractiveSpaceProps {
    taskDetails: any;
    isEditor: boolean;
}

// target is now "Box" since we aren't usually mapping text/labels separately in OD
interface SelectedElement {
    section: string; // The class name (e.g., 'Car', 'Sign')
    id: string;      // Unique ID for this specific box instance
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
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [jsonData, setJsonData] = useState<any>(null);
    const [fieldSchema, setFieldSchema] = useState<any[]>([]);
    
    const [jsonNotFound, setJsonNotFound] = useState<boolean>(false);
    const [initializing, setInitializing] = useState<boolean>(false);
    const [schemaDefined, setSchemaDefined] = useState<boolean | null>(null);

    // Layout states
    const [leftWidth, setLeftWidth] = useState<number>(70);
    const minWidth = 20; 
    const maxWidth = 90;

    const jsonURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media/annotations/${taskDetails?.id}.json`;

    // --- Data Fetching ---

    const fetchJsonData = async () => {
        try {
            if (!taskDetails?.id) return;
            const response = await fetch(jsonURL, { cache: 'no-store' });
            if (response.status === 404) {
                setJsonNotFound(true);
                return;
            }
            const data = await response.json();
            // In Object Detection, jsonData is often an array of objects: {id, label, BBox, Page}
            setJsonData(Array.isArray(data) ? data : []);
            setJsonNotFound(false);
        } catch (error) {
            console.error("Error fetching JSON data:", error);
            setJsonNotFound(true);
        }
    };

    const loadSchemaOptions = async () => {
      try {
        const projectId = taskDetails?.project_id || taskDetails?.project;
        if (!projectId) return;

        const res = await axiosInstance.get(`/projects/${projectId}/`);
        const labels = res.data?.schema?.labels || [];
        setFieldSchema(labels);
        setSchemaDefined(labels.length > 0);
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

    // --- Object Detection Specific Logic ---

    // Adds a new instance entry for a specific label class
    const addNewInstance = (labelName: string) => {
        const newId = `obj-${crypto.randomUUID()}`;
        const newEntry = {
            id: newId,
            label: labelName,
            boxLocation: { BBox: null, Page: 1 },
            text: "" 
        };

        setJsonData((prev: any[]) => [...(prev || []), newEntry]);
        
        // Immediately select it so the user can start drawing on the PDF
        setSelectedElement({
            section: labelName,
            id: newId,
            target: "Box",
            text: "",
            boxLocation: { BBox: null, Page: 1 }
        });
    };

    const deleteInstance = (id: string) => {
        setJsonData((prev: any[]) => prev.filter(item => item.id !== id));
        if (selectedElement?.id === id) setSelectedElement(null);
    };

    const handleFieldChange = (updated: SelectedElement) => {
        setJsonData((prev: any[]) => {
            return prev.map((item) => {
                if (item.id === updated.id) {
                    return {
                        ...item,
                        boxLocation: updated.boxLocation,
                        text: updated.text // OCR result if applicable
                    };
                }
                return item;
            });
        });
        setSelectedElement(updated);
    };

    // Transform jsonData into overlays for the PdfViewer
    const overlays = jsonData?.map((item: any) => ({
        id: item.id,
        section: item.label,
        target: 'Box',
        text: item.text || '',
        BBox: item.boxLocation.BBox,
        Page: item.boxLocation.Page,
        label: item.label,
        color: selectedElement?.id === item.id ? "#14b8a6" : "#3b82f6"
    })) || [];

    const handleMouseDown = (e: React.MouseEvent) => {
        const startX = e.clientX;
        const startWidth = leftWidth;
        const move = (me: MouseEvent) => {
            const delta = ((me.clientX - startX) / window.innerWidth) * 100;
            setLeftWidth(Math.min(Math.max(startWidth + delta, minWidth), maxWidth));
        };
        const up = () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
        };
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
    };

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* PDF Panel */}
            <div style={{ width: `${leftWidth}%` }} className="min-h-0 bg-slate-100">
                <PdfViewer
                    taskDetails={taskDetails}
                    isEditor={isEditor}
                    selectedElement={selectedElement}
                    setSelectedElement={setSelectedElement}
                    leftWidth={leftWidth}
                    handleFieldChange={handleFieldChange}
                    overlays={overlays}
                />
            </div>

            {/* Resizer */}
            <div className="w-1.5 h-full cursor-col-resize bg-slate-200 hover:bg-teal-400" onMouseDown={handleMouseDown} />

            {/* Right Panel */}
            <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
                {jsonNotFound && !jsonData ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
                        <h2 className="text-xl font-bold mb-4 text-slate-700">No annotation found</h2>
                        {schemaDefined ? (
                            <button 
                                onClick={() => { setJsonData([]); setJsonNotFound(false); }}
                                className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold shadow-md hover:bg-teal-700 transition-all"
                            >
                                Start New Annotation
                            </button>
                        ) : (
                            <Link href={`/object-detection/schema/${taskDetails?.project_id}`} className="text-teal-600 font-bold hover:underline">
                                Define Project Schema First
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-auto">
                            <FieldsDisplay
                                jsonData={jsonData}
                                labels={fieldSchema}
                                selectedElement={selectedElement}
                                setSelectedElement={setSelectedElement}
                                onAddInstance={addNewInstance}
                                onDeleteInstance={deleteInstance}
                            />
                        </div>

                        <div className="p-4 border-t flex gap-2 bg-white">
                            <button
                                onClick={fetchJsonData}
                                className="flex-1 py-2 bg-gray-600 text-white rounded font-bold uppercase text-xs"
                            >
                                Reset
                            </button>
                            <button 
                                onClick={() => saveJsonData(jsonData, taskDetails)}
                                className="flex-1 py-2 bg-teal-600 text-white rounded font-bold uppercase text-xs"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={async () => {
                                    await saveJsonData(jsonData, taskDetails);
                                    await axiosInstance.put(`/tasks/update/${taskDetails.id}/`, { status: 'labelled' });
                                    try {
                                        const response = await axiosInstance.get(`/projects/${taskDetails.project_id}/next_task/`);
                                        if (response.data.next_task_id) {
                                            router.push(`/object-detection/${response.data.next_task_id}`);
                                        } else {
                                            alert("No more tasks available.");
                                            router.push(`/dashboard/${taskDetails.project_id}`);
                                        }
                                    } catch (error: any) {
                                        if (error.response && error.response.status === 404) {
                                            alert("No more tasks pending to be labelled.");
                                        } else {
                                            alert("Could not find next task.");
                                        }
                                        router.push(`/dashboard/${taskDetails.project_id}`);
                                    }
                                }}
                                className="flex-1 py-2 bg-blue-600 text-white rounded font-bold uppercase text-xs"
                            >
                                Save and Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default InteractiveSpace;