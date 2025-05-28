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
    text:string|null;
    boxLocation: {
        "BBox": {
            "left": number;
            "top": number;
            "width": number;
            "height": number;
        }| null,
        "Page": number;
    }
}

const InteractiveSpace: React.FC<InteractiveSpaceProps> = ({
    taskDetails,
    isEditor
}) => {

    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [jsonData, setJsonData] = useState<any>(null);

    const jsonURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media/invoice-annotation/annotations/${taskDetails?.id}.json`;

    const fetchJsonData = async () => {
        try {
            const response = await fetch(jsonURL);
            if (!response.ok) throw new Error("Failed to fetch JSON data");
            const data = await response.json();
            const updatedData = addIdsToJsonData(data);
            setJsonData(updatedData);
            if (JSON.stringify(data) !== JSON.stringify(updatedData)) {
                saveJsonData(updatedData, taskDetails);
            }
        } catch (error) {
            console.error("Error fetching JSON data:", error);
        }
    };

    useEffect(() => {
        if (taskDetails) {
            fetchJsonData();
        }
    }, [taskDetails])

    const [leftWidth, setLeftWidth] = useState<number>(70);
    const minWidth = 20; // prevent collapsing too much
    const maxWidth = 90;

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
        console.log("updatedElement", selectedElement);
    };

    return (
        <div className="flex h-full w-full overflow-hidden">
            <div style={{ width: `${leftWidth}%` }} className="h-full">
                <PdfViewer
                    taskDetails={taskDetails}
                    isEditor={isEditor}
                    selectedElement={selectedElement}
                    leftWidth={leftWidth}
                    handleFieldChange={handleFieldChange}
                />
            </div>
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
            <FieldsDisplay
                taskDetails={taskDetails}
                jsonData={jsonData}
                setJsonData={setJsonData}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
                handleFieldChange={handleFieldChange}
            />
        </div>
    );
};

export default InteractiveSpace;
