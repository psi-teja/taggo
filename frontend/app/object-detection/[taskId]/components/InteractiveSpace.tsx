"use client";
import React, { useEffect, useState } from "react";
import PdfViewer from "@/app/components/PdfViewer";
import axiosInstance from "@/app/hooks/axiosInstance";
import Header from "@/app/components/Header";
import Link from "next/link";
import { addIdsToJsonData, saveJsonData } from "@/app/hooks/utils";
import FieldsDisplay from "./FieldsDisplay";

// Define SelectedElement matching PdfViewer expectations
interface SelectedElement {
  section: string;
  id: string;
  target: string;
  text: string | null;
  boxLocation: {
    BBox: { left: number; top: number; width: number; height: number } | null;
    Page: number;
  };
}

function genId(prefix: string) {
  try {
    // @ts-ignore
    const uuid = crypto?.randomUUID?.();
    if (uuid) return uuid;
  } catch {}
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
}

interface InteractiveSpaceProps {
  taskDetails: any;
  isEditor: boolean;
}

interface BBox {
  left: number; top: number; width: number; height: number;
}

interface ODClass {
  id: number; name: string
}

const InteractiveSpace: React.FC<InteractiveSpaceProps> = ({ taskDetails, isEditor }) => {
  const [classes, setClasses] = useState<ODClass[]>([]);
  const [schemaLoaded, setSchemaLoaded] = useState<boolean | null>(null);

  // Resizable split state (vertical)
  const [leftWidth, setLeftWidth] = useState<number>(66);
  const minWidth = 20;
  const maxWidth = 90;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const startWidth = leftWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      let newWidth = startWidth + deltaPercent;
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

  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");

  const [jsonData, setJsonData] = useState<any>(null);
  const [jsonNotFound, setJsonNotFound] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(false);

  const jsonURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media/object-detection/annotations/${taskDetails?.id}.json`;

  const fetchClasses = async () => {
    try {
      const res = await axiosInstance.get('/schema/options', { params: { task_type: 'object-detection' } });
      const opts = res.data || {};
      const cls = opts["Classes"] || [];
      setClasses(cls.map((n: string, i: number) => ({ id: i + 1, name: n })));
      setSchemaLoaded(Array.isArray(cls) && cls.length > 0);
    } catch (e) {
      setSchemaLoaded(null);
    }
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
      setJsonData(data);
      setJsonNotFound(false);
    } catch (e) {
      if (!jsonData) setJsonNotFound(true);
    }
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

  useEffect(() => {
    fetchClasses();
    fetchJsonData();
  }, [taskDetails?.id]);

  // Start drawing automatically when class is selected
  useEffect(() => {
    if (selectedClass) {
      setSelectedElement({
        section: 'Objects',
        id: genId('od'),
        target: 'Value',
        text: selectedClass,
        boxLocation: { BBox: null, Page: 1 },
      });
    } else {
      setSelectedElement(null);
    }
  }, [selectedClass]);

  // Allow ESC to cancel drawing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedElement(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleAddBox = () => {
    if (!selectedClass) {
      alert('Select a class first');
      return;
    }
    // Re-arm explicitly (kept for users preferring a button)
    setSelectedElement({
      section: 'Objects',
      id: genId('od'),
      target: 'Value',
      text: selectedClass,
      boxLocation: { BBox: null, Page: 1 },
    });
  };

  const handleBoxChange = (el: SelectedElement) => {
    // Called by PdfViewer after drawing
    if (!el.boxLocation.BBox) return;
    const entry = {
      id: el.id,
      Class: el.text || '',
      BBox: el.boxLocation.BBox,
      Page: el.boxLocation.Page || 1,
    };
    const data = jsonData ? { ...jsonData } : {};
    const arr = Array.isArray(data.Objects) ? [...data.Objects] : [];
    data.Objects = [...arr, entry];
    setJsonData(data);
    // Auto-rearm if a class remains selected for quick consecutive boxes
    if (selectedClass) {
      setSelectedElement({
        section: 'Objects',
        id: genId('od'),
        target: 'Value',
        text: selectedClass,
        boxLocation: { BBox: null, Page: el.boxLocation.Page || 1 },
      });
    } else {
      setSelectedElement(null);
    }
  };

  const deleteBox = (id: string) => {
    if (!jsonData || !Array.isArray(jsonData.Objects)) return;
    const data = { ...jsonData, Objects: jsonData.Objects.filter((o: any) => String(o.id) !== String(id)) };
    setJsonData(data);
  };

  // Save annotations to backend and then refresh from server
  const handleSave = async () => {
    const data = jsonData || { Objects: [] };
    await saveJsonData(data, taskDetails);
    await fetchJsonData();
  };
  
  // Reset local changes by reloading server state
  const handleReset = async () => {
    await fetchJsonData();
  };
  

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* PDF panel */}
      <div style={{ width: `${leftWidth}%` }} className="h-full min-h-0">
        <PdfViewer
          taskDetails={taskDetails}
          isEditor={isEditor}
          selectedElement={selectedElement as any}
          leftWidth={leftWidth}
          handleFieldChange={(el: any) => handleBoxChange(el as SelectedElement)}
          overlays={(jsonData?.Objects || []).map((o: any) => ({
            id: String(o.id),
            BBox: o.BBox,
            Page: o.Page,
            label: o.Class,
            color: '#10b981' // emerald border for OD boxes
          }))}
        />
      </div>

      {/* Resizer */}
      <div
        className="relative z-10 w-0.5 cursor-col-resize select-none flex items-center justify-center"
        style={{ minWidth: "4px" }}
        onMouseDown={(e) => {
          document.body.style.userSelect = "none";
          handleMouseDown(e);
          const restore = () => {
            document.body.style.userSelect = "";
            document.removeEventListener("mouseup", restore);
          };
          document.addEventListener("mouseup", restore);
        }}
        onTouchStart={(e) => {
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
        onDoubleClick={() => setLeftWidth(66)}
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
          <div className="flex flex-col gap-1 items-center justify-center pointer-events-none">
            <span className="block w-0.5 h-4 bg-gray-400 rounded"></span>
            <span className="block w-0.5 h-4 bg-gray-400 rounded"></span>
            <span className="block w-0.5 h-4 bg-gray-400 rounded"></span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <FieldsDisplay
        taskDetails={taskDetails}
        schemaLoaded={schemaLoaded}
        classes={classes}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        onArmDraw={handleAddBox}
        drawingArmed={!!selectedElement}
        jsonData={jsonData}
        onDeleteBox={deleteBox}
        onSave={handleSave}
        onReset={handleReset}
        onDownload={downloadJsonData}
      />
    </div>
  );
};

export default InteractiveSpace;
