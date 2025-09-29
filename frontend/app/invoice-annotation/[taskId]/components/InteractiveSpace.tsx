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
    const [leftWidth, setLeftWidth] = useState<number>(70);
    const minWidth = 20; // prevent collapsing too much
    const maxWidth = 90;

    const jsonURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media/invoice-annotation/annotations/${taskDetails?.id}.json`;

    console.log("JSON URL:", jsonURL);

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
            LineItems: [],
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


    const handleFieldChange = (updatedElement: SelectedElement) => {
        setSelectedElement(updatedElement);
        const section = updatedElement.section;
        const id = updatedElement.id;
        const target = updatedElement.target;
        const text = updatedElement.text;
        const BBox = updatedElement.boxLocation.BBox;

        const newJsonData = { ...jsonData };
        const fields = newJsonData[section] || [];
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
        setJsonData(newJsonData);
    };

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Left PDF panel */}
            <div style={{ width: `${leftWidth}%` }} className="h-full">
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
            {/* Right panel */}
            <div className="flex-1 h-full overflow-auto">
                {jsonNotFound && !jsonData ? (
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
                    />
                )}
            </div>
        </div>
    );
};

export default InteractiveSpace;
