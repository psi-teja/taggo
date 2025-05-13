import { useEffect, useState } from "react";

interface SelectedElement {
    section: string;
    id: string;
    target: string;
    boxLocation: {
        BoundingBox: {
            left: number;
            top: number;
            width: number;
            height: number;
        };
        Page: number;
    };
}

interface FieldsDisplayProps {
    taskDetails?: { id?: string | number };
    jsonData: any;
    setJsonData: React.Dispatch<React.SetStateAction<any>>;
    handleFieldClick: (element: any) => void;
    selectedElement: SelectedElement | null;
    setSelectedElement: React.Dispatch<React.SetStateAction<SelectedElement | null>>;
}

const FieldsDisplay: React.FC<FieldsDisplayProps> = ({ taskDetails, jsonData, setJsonData, handleFieldClick, selectedElement, setSelectedElement }) => {

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


    return (
        <div className="flex-1 overflow-auto">
            <div className="flex justify-between bg-gray-100 p-1 shadow items-center space-x-4 bg-slate-300 sticky top-0 left-0 z-10">
                <div className="font-semibold">ID:</div>
                <div className="truncate text-ellipsis overflow-hidden text-right">
                    {taskDetails && taskDetails.id}
                </div>
            </div>

            {jsonData && Object.entries(jsonData).map(([section, fields]) => (
                <div key={section} className="p-2">
                    <div className="space-y-2">
                        {Array.isArray(fields) && fields.map((field: any) => (
                            <div key={field.id} className={`rounded-lg shadow p-2 space-y-2 ${selectedElement?.id === String(field.id) ? "border border-blue-500 bg-blue-100" : "bg-white hover:bg-gray-200"}  transition duration-300 cursor-pointer`}
                                
                                    
                                    >
                                <div className="items-center gap-2">
                                    <select value={field.Name || ""}
                                        onChange={(e) => {
                                            const newJsonData = { ...jsonData };
                                            const newField = { ...field, Name: e.target.value };
                                            newJsonData[section] = fields.map((f: any) => f.id === field.id ? newField : f);
                                            setJsonData(newJsonData);
                                        }}
                                        className="bg-gradient-to-b from-gray-200 via-white to-gray-200 p-2 outline-none border border-gray-300 focus:border-blue-500 rounded transition w-full shadow-sm">
                                        <option value="" disabled>
                                            -- select --
                                        </option>
                                        {dropDownOptions[section]?.map((option: string) => (
                                            <option key={option} value={option}>
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
                                        boxLocation: {
                                            BoundingBox: field.Value.LabelBoundingBox,
                                            Page: field.Value.Page,
                                        }
                                    })}>
                                        <input
                                            type="text"
                                            value={field.Value?.Label || ""}
                                            placeholder="label"
                                            className="bg-white p-2 outline-none border border-gray-300  rounded transition w-full shadow-sm"
                                            onChange={(e) => {
                                                const newJsonData = { ...jsonData };
                                                const newField = { ...field, Value: { ...field.Value, Label: e.target.value } };
                                                newJsonData[section] = fields.map((f: any) => f.id === field.id ? newField : f);
                                                setJsonData(newJsonData);
                                            }
                                            }

                                        />
                                        {field.Value?.LabelBoundingBox && (
                                            <img
                                                src="/rect.png"
                                                alt="Draw Box"
                                                className="h-5 w-5 ml-2 opacity-80 hover:opacity-100 transition"
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1"
                                    onClick={() =>
                                    setSelectedElement({
                                        section: section,
                                        id: field.id,
                                        target: "Value",
                                        boxLocation: {
                                            BoundingBox: field.Value.BoundingBox,
                                            Page: field.Value.Page,
                                        }
                                    })}
                                    >
                                        <input
                                            type="text"
                                            value={field.Value?.Text || ""}
                                            placeholder="value"
                                            className="bg-white p-2 outline-none border border-gray-300 focus:border-red-300 focus:border-2 rounded transition w-full shadow-sm"
                                            onChange={(e) => {
                                                const newJsonData = { ...jsonData };
                                                const newField = { ...field, Value: { ...field.Value, Text: e.target.value } };
                                                newJsonData[section] = fields.map((f: any) => f.id === field.id ? newField : f);
                                                setJsonData(newJsonData);
                                            }
                                            }
                                        />
                                        {field.Value?.BoundingBox && (
                                            <img
                                                src="/rect.png"
                                                alt="Draw Box"
                                                className="h-4 w-4 m-2 opacity-80 hover:opacity-100 transition"
                                            />
                                        )}
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FieldsDisplay;
