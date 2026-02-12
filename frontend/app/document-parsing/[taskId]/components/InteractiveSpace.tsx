"use client";
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
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [jsonData, setJsonData] = useState<any>(null);
    const [jsonNotFound, setJsonNotFound] = useState<boolean>(false);
    const [initializing, setInitializing] = useState<boolean>(false);

    // Layout states
    const [leftWidth, setLeftWidth] = useState<number>(70);
    const minWidth = 20; 
    const maxWidth = 90;
    const [topHeight, setTopHeight] = useState<number>(60);
    const minHeight = 20;
    const maxHeight = 90;

    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [sectionTypes, setSectionTypes] = useState<Record<string, 'singular' | 'table'>>({});
    const [schemaDefined, setSchemaDefined] = useState<boolean | null>(null);

    const jsonURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media/annotations/${taskDetails?.id}.json`;

    const deriveSectionTypes = (data: any) => {
        const types: Record<string, 'singular' | 'table'> = {};
        if (!data) return types;
        Object.keys(data).forEach(key => {
            if (key === "Meta") return;
            const val = data[key];
            // Check for new table structure {columns: [], rows: []}
            const isTable = (val && typeof val === 'object' && Array.isArray(val.rows)) || 
                            (Array.isArray(val) && Array.isArray(val[0]));
            types[key] = isTable ? 'table' : 'singular';
        });
        return types;
    }

    const ensureActiveSection = (data: any, current: string | null) => {
        const keys = Object.keys(data || {}).filter(k => k !== "Meta");
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
            const types = deriveSectionTypes(updatedData);
            setSectionTypes(types);
            setActiveSection(prev => ensureActiveSection(updatedData, prev));
        } catch (error) {
            console.error("Error fetching JSON data:", error);
            if (!jsonData) setJsonNotFound(true);
        }
    };

    const fetchProjectSchema = async (projectId: string) => {
        try {
            const res = await axiosInstance.get(`/projects/${projectId}/`);
            return res.data?.schema || null;
        } catch (e) {
            return null;
        }
    };

    const checkSchemaDefined = async () => {
        try {
            const projectId = taskDetails?.project_id; // Note: Ensure this matches your taskDetails prop structure
            if (!projectId) { setSchemaDefined(null); return; }
            const schema = await fetchProjectSchema(projectId);
            if (!schema) { setSchemaDefined(false); return; }
            const hasSections = (schema.fields?.length > 0) || (schema.tables?.length > 0);
            setSchemaDefined(hasSections);
        } catch (e) {
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
            const projectId = taskDetails?.project_id;
            if (!projectId) throw new Error('No project ID');
            const schema = await fetchProjectSchema(projectId);
            
            if (!schema || (!schema.fields?.length && !schema.tables?.length)) {
                alert('Schema is empty. Please define it first.');
                return;
            }

            const genId = () => `node-${crypto.randomUUID()}`;
            const now = Date.now();
            const data: any = {};

            // 1. Map Fields to a "Singular" section
            if (schema.fields?.length > 0) {
                data['Singular'] = schema.fields.map((f: any) => ({
                    id: genId(),
                    Name: f.name,
                    Value: { Label: '', Text: '', LabelBoundingBox: null, BoundingBox: null, Page: 1 }
                }));
            }

            // 2. Map Tables to individual sections
            schema.tables?.forEach((t: any) => {
                const columns = (t.columns || []).map((col: any, cIdx: number) => ({
                    id: col.id || `col-${t.id}-${cIdx}-${now}`,
                    Name: col.name,
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

    // --- Resizer Logic (Preserved) ---
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

    // --- Update Logic (Preserved) ---
const handleFieldChange = (updated: SelectedElement) => {
  setJsonData((prev: any) => {
    const newData = { ...prev };
    const sectionData = newData[updated.section];

    // --- CASE 1: SINGULAR (GENERAL) FIELDS ---
    if (Array.isArray(sectionData)) {
      newData[updated.section] = sectionData.map((field: any) => {
        if (String(field.id) === updated.id) {
          const newValue = { ...field.Value };
          if (updated.target === "Label") {
            newValue.Label = updated.text;
            newValue.LabelBoundingBox = updated.boxLocation.BBox;
          } else {
            newValue.Text = updated.text;
            newValue.BoundingBox = updated.boxLocation.BBox;
          }
          return { ...field, Value: newValue };
        }
        return field;
      });
    } 
    // --- CASE 2: TABLE SECTIONS ---
    else if (sectionData && typeof sectionData === 'object') {
      if (updated.target === "Label") {
        // Update Column Header
        sectionData.columns = sectionData.columns.map((col: any) => {
          if (String(col.id) === updated.id) {
            return { ...col, Label: updated.text, LabelBoundingBox: updated.boxLocation.BBox };
          }
          return col;
        });
      } else {
        // Update Row Cell
        sectionData.rows = sectionData.rows.map((row: any[]) =>
          row.map((cell: any) => {
            if (String(cell.id) === updated.id) {
              return {
                ...cell,
                Value: { ...cell.Value, Text: updated.text, BoundingBox: updated.boxLocation.BBox }
              };
            }
            return cell;
          })
        );
      }
    }
    return newData;
  });
};
    const isTableSection = activeSection ? (sectionTypes[activeSection] === 'table') : false;

    return (
        <div className={`flex h-full w-full overflow-hidden ${isTableSection ? 'flex-col' : ''}`}>
            {/* PDF panel */}
            <div style={isTableSection ? { height: `${topHeight}%` } : { width: `${leftWidth}%` }} className="min-h-0">
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
                className={`relative z-10 bg-slate-200 hover:bg-teal-400 transition-colors ${isTableSection ? 'h-1 w-full cursor-row-resize' : 'w-1 h-full cursor-col-resize'}`}
                onMouseDown={isTableSection ? handleRowMouseDown : handleMouseDown}
            />

            {/* Fields panel */}
            <div className="flex-1 h-full overflow-auto min-h-0">
                {jsonNotFound && !jsonData ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
                        <h2 className="text-xl font-bold mb-4 text-slate-700">No annotation found</h2>
                        {schemaDefined ? (
                            <button onClick={handleInitializeTemplate} className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold shadow-md hover:bg-teal-700 transition-all">
                                {initializing ? 'Initializing...' : 'Start Annotation'}
                            </button>
                        ) : (
                            <Link href={`/dashboard/${taskDetails?.project}/schema`} className="text-teal-600 font-bold hover:underline">
                                Define Project Schema First
                            </Link>
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
                        handleSave={() => { saveJsonData(jsonData, taskDetails); alert("Saved!"); }}
                        handleReset={fetchJsonData}
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                        isTableSection={isTableSection}
                    />
                )}
            </div>
        </div>
    );
};

export default InteractiveSpace;