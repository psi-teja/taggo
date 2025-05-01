import React, { useState } from "react";
import PdfViewer from "@/app/components/PdfViewer";

interface InteractiveSpaceProps {
    taskDetails: any;
    isEditor: boolean;
}

const InteractiveSpace: React.FC<InteractiveSpaceProps> = ({
    taskDetails,
    isEditor,
}) => {
    const [boxLocation, setBoxLocation] = useState<Record<string, any> | null>(
        null
    );

    // width in percentage (initially 70%)
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

    return (
        <div className="flex h-full w-full overflow-hidden">
            <div style={{ width: `${leftWidth}%` }} className="h-full">
                <PdfViewer
                    taskDetails={taskDetails}
                    isEditor={isEditor}
                    boxLocation={boxLocation}
                    leftWidth={leftWidth}
                />
            </div>

            <div
                className="relative z-10 w-2 cursor-col-resize group border-x border-gray-400 bg-gray-200 hover:bg-gray-300"
                style={{ minWidth: "8px" }}
                onMouseDown={handleMouseDown}
                aria-label="Resize panel"
                role="separator"
                tabIndex={0}
                onKeyDown={e => {
                    if (e.key === "ArrowLeft") setLeftWidth(w => Math.max(minWidth, w - 2));
                    if (e.key === "ArrowRight") setLeftWidth(w => Math.min(maxWidth, w + 2));
                }}
            >
                <div className="absolute inset-0 bg-gray-300 transition-colors rounded" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-500 rounded" />
            </div>

            <div className="flex-1 overflow-auto">
                <div className="flex justify-between bg-gray-100 p-1 shadow items-center space-x-4 bg-slate-300 sticky top-0 left-0 z-10">
                    <div className="font-semibold">ID:</div>
                    <div className="truncate text-ellipsis overflow-hidden text-right">
                        {taskDetails && taskDetails.id}
                    </div>
                </div>
                
            </div>
        </div>
    );
};

export default InteractiveSpace;
