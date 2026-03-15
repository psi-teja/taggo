"use client";
import React, { useState, useEffect } from "react";
import PdfViewer from "@/app/components/PdfViewer";
import { saveJsonData } from "@/app/hooks/utils";
import axiosInstance from "@/app/hooks/axiosInstance";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, Tag } from "lucide-react";

interface ClassificationSpaceProps {
    taskDetails: any;
    projectDetails: any;
    isEditor: boolean;
}

const ClassificationSpace: React.FC<ClassificationSpaceProps> = ({
    taskDetails,
    projectDetails,
    isEditor
}) => {
    const router = useRouter();
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [classificationOptions, setClassificationOptions] = useState<any[]>([]);
    const [jsonNotFound, setJsonNotFound] = useState<boolean>(false);
    const [schemaDefined, setSchemaDefined] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Layout states
    const [leftWidth, setLeftWidth] = useState<number>(70);
    const minWidth = 20; 
    const maxWidth = 90;

    const jsonURL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media/annotations/${taskDetails?.id}.json`;

    const fetchAnnotationData = async () => {
        if (!taskDetails?.id) return;
        try {
            const response = await fetch(jsonURL, { cache: 'no-store' });
            if (response.status === 404) {
                setJsonNotFound(true);
                setSelectedClass(null);
                return;
            }
            const data = await response.json();
            setSelectedClass(data?.classification || null);
            setJsonNotFound(false);
        } catch (error) {
            console.error("Error fetching JSON data:", error);
            setJsonNotFound(true);
        }
    };

    const loadSchemaOptions = async () => {
        if (!projectDetails?.id) return;
        try {
            // Schema is already part of projectDetails passed as a prop
            const classes = projectDetails?.schema?.classes || [];
            setClassificationOptions(classes);
            setSchemaDefined(classes.length > 0);
        } catch (e) {
            console.error("Error loading project schema:", e);
            setSchemaDefined(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        if (taskDetails && projectDetails) {
            fetchAnnotationData();
            loadSchemaOptions();
            setIsLoading(false);
        }
    }, [taskDetails, projectDetails]);

    const handleSave = async () => {
        const dataToSave = { classification: selectedClass };
        await saveJsonData(dataToSave, taskDetails);
    };

    const handleSaveAndNext = async () => {
        await handleSave();
        await axiosInstance.put(`/tasks/update/${taskDetails.id}/`, { status: 'labelled' });
        try {
            const response = await axiosInstance.get(`/projects/${projectDetails.id}/next_task/`);
            if (response.data.next_task_id) {
                router.push(`/document-classification/${response.data.next_task_id}`);
            } else {
                alert("No more tasks available.");
                router.push(`/dashboard/${projectDetails.id}`);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                alert("No more tasks pending to be labelled.");
            } else {
                alert("Could not find next task.");
            }
            router.push(`/dashboard/${projectDetails.id}`);
        }
    };

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

    if (isLoading || !projectDetails) {
        return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-teal-500" /></div>;
    }

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* PDF Panel */}
            <div style={{ width: `${leftWidth}%` }} className="min-h-0 bg-slate-100">
                <PdfViewer
                    taskDetails={taskDetails}
                    isEditor={isEditor}
                    selectedElement={null}
                    setSelectedElement={() => {}}
                    leftWidth={leftWidth}
                    handleFieldChange={() => {}}
                    overlays={[]}
                />
            </div>

            {/* Resizer */}
            <div className="w-1.5 h-full cursor-col-resize bg-slate-200 hover:bg-teal-400" onMouseDown={handleMouseDown} />


            {/* Right Panel */}
            <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
                {!schemaDefined ? (
                     <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
                        <h2 className="text-xl font-bold mb-4 text-slate-700">No Classes Defined</h2>
                        <Link href={`/document-classification/schema/${taskDetails?.project_id}`} className="text-teal-600 font-bold hover:underline">
                            Define Project Schema First
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Tag size={20}/> Document Class</h2>
                            <p className="text-xs text-slate-500 mt-1">Select one class for the document.</p>
                        </div>
                        <div className="flex-1 overflow-auto p-6 space-y-2">
                            {classificationOptions.map(cls => (
                                <button
                                    key={cls.id}
                                    onClick={() => isEditor && setSelectedClass(cls.name)}
                                    disabled={!isEditor}
                                    className={`w-full flex items-center justify-between text-left p-4 rounded-lg transition-all border-2 ${selectedClass === cls.name ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-slate-200 hover:border-teal-400'} ${!isEditor ? 'cursor-not-allowed' : ''}`}
                                >
                                    <span className="font-semibold">{cls.name}</span>
                                    {selectedClass === cls.name && <Check size={20} className="text-teal-600" />}
                                </button>
                            ))}
                        </div>

                        {isEditor && (
                            <div className="p-4 border-t flex flex-col gap-2 bg-white">
                                <button
                                    onClick={handleSave}
                                    className="w-full py-3 bg-teal-600 text-white rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-teal-700 transition-all"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={handleSaveAndNext}
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-blue-700 transition-all"
                                >
                                    Save and Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ClassificationSpace;
