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
}

const FieldsDisplay: React.FC<FieldsDisplayProps> = ({ taskDetails, jsonData, setJsonData, selectedElement, setSelectedElement }) => {

    if (!jsonData) {
        return (
            <div className="relative inset-0 flex items-center justify-center bg-white bg-opacity-75 h-screen w-full">
                <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
            </div>
        );
    }

    const [dropDownOptions, setDropDownOptions] = useState<{ [key: string]: string[] }>({});

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


    return (
        <div className="flex-1 overflow-auto">
            <div className="flex text-sm text-ellipsis justify-between bg-slate-400 p-1 shadow items-center space-x-4 sticky top-0 left-0 z-10">
                <div className="">ID:</div>
                <div className="truncate  overflow-hidden text-right">
                    {taskDetails && taskDetails.id}
                </div>
                <div
                    className="hover:bg-gray-200 rounded"
                    title="Download JSON"
                    onClick={() => downloadJsonData()}
                >
                    <svg
                        className="h-5 w-5 text-black "
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path stroke="none" d="M0 0h24v24H0z" />
                        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                        <polyline points="7 11 12 16 17 11" />
                        <line x1="12" y1="4" x2="12" y2="16" />
                    </svg>
                </div>
            </div>

            {jsonData && Object.entries(jsonData).map(([section, fields]) => (
                <div className="space-y-2 bg-gray-100 p-2" key={section}>
                    {Array.isArray(fields) && fields.length > 0 && !Array.isArray(fields[0]) && fields.map((field: any) => (
                        <div
                            key={field.id}
                            className={`rounded-lg shadow-md p-3 space-y-3 ${selectedElement?.id === String(field.id)
                                ? "border-2 border-blue-500 bg-blue-50"
                                : "bg-white hover:bg-gray-50 border border-gray-400"
                                } transition duration-200 cursor-pointer`}
                        >
                            <div className="items-center gap-3">
                                <select
                                    value={field.Name || ""}
                                    onChange={(e) => {
                                        const newJsonData = { ...jsonData };
                                        const newField = { ...field, Name: e.target.value };
                                        newJsonData[section] = fields.map((f: any) => f.id === field.id ? newField : f);
                                        setJsonData(newJsonData);
                                    }}
                                    className="bg-gradient-to-b from-white to-gray-300 p-2 outline-none border border-gray-400 focus:border-blue-400 rounded-md transition w-full shadow-sm font-medium text-gray-700"
                                >
                                    <option value="" disabled className="text-gray-400">
                                        -- select --
                                    </option>
                                    {dropDownOptions[section]?.map((option: string) => (
                                        <option key={option} value={option} className="text-gray-700">
                                            {option}
                                        </option>
                                    ))}
                                </select>

                                <div
                                    onClick={() =>
                                        setSelectedElement({
                                            section: section,
                                            id: field.id,
                                            target: "Label",
                                            text: field.Value?.Label ?? "",
                                            boxLocation: {
                                                BBox: field.Value.LabelBoundingBox,
                                                Page: field.Value.Page,
                                            }
                                        })}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={field.Value?.Label || ""}
                                        placeholder="label"
                                        className={`bg-white p-2 outline-none border border-gray-200 rounded-md transition w-full shadow-sm text-gray-700 ${((selectedElement?.id == field.id) && (selectedElement?.target == "Label")) ? "border-red-400 border-2" : ""}`}
                                        onChange={(e) => {
                                            const newJsonData = { ...jsonData };
                                            const newField = { ...field, Value: { ...field.Value, Label: e.target.value } };
                                            newJsonData[section] = fields.map((f: any) => f.id === field.id ? newField : f);
                                            setJsonData(newJsonData);
                                        }}
                                    />
                                    {field.Value?.LabelBoundingBox && (
                                        <button className="relative"
                                            disabled={!((selectedElement?.id == field.id) && (selectedElement?.target == "Label"))}
                                            onClick={() => {
                                                setJsonData((prevJsonData: any) => ({
                                                    ...prevJsonData,
                                                    [section]: prevJsonData[section].map((f: any) =>
                                                        f.id === field.id
                                                            ? { ...f, Value: { ...f.Value, LabelBoundingBox: null } }
                                                            : f
                                                    ),
                                                }));
                                            }}>
                                            <img
                                                src="/rect.png"
                                                alt="Draw Box"
                                                className="h-5 w-6"

                                            />
                                            {(selectedElement?.id == field.id) && (selectedElement?.target == "Label") && <XIcon />}
                                        </button>
                                    )}
                                </div>

                                <div
                                    className="flex items-center gap-2"
                                    onClick={() =>
                                        setSelectedElement({
                                            section: section,
                                            id: field.id,
                                            target: "Value",
                                            text: field.Value?.Text,
                                            boxLocation: {
                                                BBox: field.Value.BoundingBox,
                                                Page: field.Value.Page,
                                            }
                                        })}
                                >
                                    <input
                                        type="text"
                                        value={field.Value?.Text || ""}
                                        placeholder="value"
                                        className={`bg-white p-2 outline-none border border-gray-200 rounded-md transition w-full shadow-sm text-gray-700 ${((selectedElement?.id == field.id) && (selectedElement?.target == "Value")) ? "border-red-400 border-2" : ""}`}
                                        onChange={(e) => {
                                            const newJsonData = { ...jsonData };
                                            const newField = { ...field, Value: { ...field.Value, Text: e.target.value } };
                                            newJsonData[section] = fields.map((f: any) => f.id === field.id ? newField : f);
                                            setJsonData(newJsonData);
                                        }}
                                    />
                                    {field.Value?.BoundingBox && (
                                        <button className="relative"
                                            onClick={() => {
                                                setJsonData((prevJsonData: any) => ({
                                                    ...prevJsonData,
                                                    [section]: prevJsonData[section].map((f: any) =>
                                                        f.id === field.id
                                                            ? { ...f, Value: { ...f.Value, BoundingBox: null } }
                                                            : f
                                                    ),
                                                }));
                                            }}
                                            disabled={!((selectedElement?.id == field.id) && (selectedElement?.target == "Value"))}>
                                            <img
                                                src="/rect.png"
                                                alt="Draw Box"
                                                className="h-5 w-6"

                                            />
                                            {(selectedElement?.id == field.id) && (selectedElement?.target == "Value") && <XIcon />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default FieldsDisplay;
