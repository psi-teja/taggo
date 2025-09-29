import { useEffect, useState } from "react";
import XIcon from "@/app/components/XIcon";

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

interface FieldsDisplayProps {
    taskDetails?: { id?: string | number };
    jsonData: any;
    setJsonData: React.Dispatch<React.SetStateAction<any>>;
    selectedElement: SelectedElement | null;
    setSelectedElement: React.Dispatch<React.SetStateAction<SelectedElement | null>>;
    handleFieldChange: (element: SelectedElement) => void;
    handleSave: () => void;
    handleReset: () => void;
}

const FieldsDisplay: React.FC<FieldsDisplayProps> = ({ taskDetails, jsonData, setJsonData, selectedElement, setSelectedElement, handleFieldChange, handleSave, handleReset }) => {

    if (!jsonData) {
        return (
            <div className="relative inset-0 flex items-center justify-center bg-white bg-opacity-75 h-screen w-full">
                <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
            </div>
        );
    }

    const [dropDownOptions, setDropDownOptions] = useState<{ [key: string]: string[] }>({});
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Determine list of tab sections (only those that are arrays)
    const tabSections = Object.keys(jsonData).filter(k => Array.isArray(jsonData[k]));

    // Initialize / adjust active section when jsonData changes
    useEffect(() => {
        if (tabSections.length === 0) {
            setActiveSection(null);
        } else if (!activeSection || !tabSections.includes(activeSection)) {
            setActiveSection(tabSections[0]);
        }
    }, [jsonData]);

    useEffect(() => {
        fetch("/fields.json")
            .then((res) => res.json())
            .then((data) => setDropDownOptions(data))
            .catch((err) => {
                console.error("Failed to load fields.json", err);
                setDropDownOptions({});
            });
    }, []);

    const downloadJsonData = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData, null, 2));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${taskDetails?.id || "task"}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const addFieldToActive = () => {
        if (!activeSection) return;
        const newField = {
            id: `new-${Date.now()}`,
            Name: "",
            Value: {
                Label: "",
                Text: "",
                LabelBoundingBox: null,
                BoundingBox: null,
                Page: 1,
            },
        };
        const newJson = { ...jsonData };
        newJson[activeSection] = [...(newJson[activeSection] || []), newField];
        setJsonData(newJson);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header Bar (static) */}
            <div className="flex text-sm text-ellipsis justify-between bg-slate-400 p-1 shadow items-center space-x-4">
                <div>ID:</div>
                <div className="truncate overflow-hidden text-right flex-1">{taskDetails && taskDetails.id}</div>
                <div
                    className="hover:bg-gray-200 rounded p-1 cursor-pointer"
                    title="Download JSON"
                    onClick={downloadJsonData}
                >
                    <svg className="h-5 w-5 text-black" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" />
                        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                        <polyline points="7 11 12 16 17 11" />
                        <line x1="12" y1="4" x2="12" y2="16" />
                    </svg>
                </div>
            </div>

            {/* Tabs Bar (static) */}
            {tabSections.length > 0 && (
                <div className="bg-white border-b border-gray-200 flex items-center gap-2 px-3 py-2 overflow-x-auto">
                    {tabSections.map(section => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shadow ${activeSection === section
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            {section}
                            {Array.isArray(jsonData[section]) && jsonData[section].length > 0 && (
                                <span className="ml-2 text-xs bg-white/30 px-2 py-0.5 rounded-full">{jsonData[section].length}</span>
                            )}
                        </button>
                    ))}
                    <button
                        onClick={addFieldToActive}
                        disabled={!activeSection}
                        className="ml-auto bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-md text-sm font-semibold shadow"
                        title="Add field to active section"
                    >+ Field</button>
                </div>
            )}

            {/* Scrollable content area */}
            <div className="flex-1 overflow-auto">
                {activeSection && Array.isArray(jsonData[activeSection]) && (
                    <div className="space-y-2 bg-gray-100 p-2">
                        {jsonData[activeSection].map((field: any) => (
                            <div
                                key={field.id}
                                className={`rounded-lg shadow-md p-3 space-y-3 ${selectedElement?.id === String(field.id) ? 'border-2 border-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50 border border-gray-400'} transition duration-200 cursor-pointer`}
                            >
                                <div className="items-center gap-3">
                                    <select
                                        value={field.Name || ""}
                                        onChange={(e) => {
                                            const newJsonData = { ...jsonData };
                                            const newField = { ...field, Name: e.target.value };
                                            newJsonData[activeSection] = jsonData[activeSection].map((f: any) => f.id === field.id ? newField : f);
                                            setJsonData(newJsonData);
                                        }}
                                        className="bg-gradient-to-b from-white to-gray-300 p-2 outline-none border border-gray-400 focus:border-blue-400 rounded-md transition w-full shadow-sm font-medium text-gray-700"
                                    >
                                        <option value="" disabled className="text-gray-400">-- select --</option>
                                        {dropDownOptions[activeSection]?.map((option: string) => (
                                            <option key={option} value={option} className="text-gray-700">{option}</option>
                                        ))}
                                    </select>

                                    {/* Label */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="text"
                                            onClick={() => setSelectedElement({ section: activeSection, id: field.id, target: "Label", text: field.Value?.Label ?? "", boxLocation: { BBox: field.Value.LabelBoundingBox, Page: field.Value.Page } })}
                                            value={field.Value?.Label || ""}
                                            placeholder="label"
                                            className={`bg-white p-2 outline-none border border-gray-200 rounded-md transition w-full shadow-sm text-gray-700 ${(selectedElement?.id == field.id && selectedElement?.target == "Label") ? "border-red-400 border-2" : ""}`}
                                            onChange={(e) => {
                                                const updatedElement = selectedElement;
                                                if (updatedElement) {
                                                    updatedElement.text = e.target.value;
                                                    handleFieldChange(updatedElement);
                                                }
                                            }}
                                        />
                                        {field.Value?.LabelBoundingBox && (
                                            <button
                                                className="relative"
                                                disabled={!(selectedElement?.id == field.id && selectedElement?.target == "Label")}
                                                onClick={() => {
                                                    const updatedElement = selectedElement;
                                                    if (updatedElement) {
                                                        updatedElement.boxLocation.BBox = null;
                                                        handleFieldChange(updatedElement);
                                                    }
                                                }}
                                            >
                                                <img src="/rect.png" alt="Draw Box" className="h-5 w-6" />
                                                {(selectedElement?.id == field.id && selectedElement?.target == "Label") && <XIcon />}
                                            </button>
                                        )}
                                    </div>

                                    {/* Value */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            onClick={() => setSelectedElement({ section: activeSection, id: field.id, target: "Value", text: field.Value?.Text, boxLocation: { BBox: field.Value.BoundingBox, Page: field.Value.Page } })}
                                            type="text"
                                            value={field.Value?.Text || ""}
                                            placeholder="value"
                                            className={`bg-white p-2 outline-none border border-gray-200 rounded-md transition w-full shadow-sm text-gray-700 ${(selectedElement?.id == field.id && selectedElement?.target == "Value") ? "border-red-400 border-2" : ""}`}
                                            onChange={(e) => {
                                                const updatedElement = selectedElement;
                                                if (updatedElement) {
                                                    updatedElement.text = e.target.value;
                                                    handleFieldChange(updatedElement);
                                                }
                                            }}
                                        />
                                        {field.Value?.BoundingBox && (
                                            <button
                                                className="relative"
                                                onClick={() => {
                                                    const updatedElement = selectedElement;
                                                    if (updatedElement) {
                                                        updatedElement.boxLocation.BBox = null;
                                                        handleFieldChange(updatedElement);
                                                    }
                                                }}
                                                disabled={!(selectedElement?.id == field.id && selectedElement?.target == "Value")}
                                            >
                                                <img src="/rect.png" alt="Draw Box" className="h-5 w-6" />
                                                {(selectedElement?.id == field.id && selectedElement?.target == "Value") && <XIcon />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Save/Reset Bar (static at bottom) */}
            <div className="bg-gradient-to-t from-white via-gray-50 to-transparent shadow-lg p-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={handleSave}
                >Save</button>
                <button
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-md shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
                    onClick={handleReset}
                >Reset</button>
            </div>
        </div>
    );
};

export default FieldsDisplay;
