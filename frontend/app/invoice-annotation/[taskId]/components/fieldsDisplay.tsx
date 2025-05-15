import { useEffect, useState } from "react";

interface SelectedElement {
    section: string;
    id: string;
    target: string;
    boxLocation: {
        BBox: {
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
            <div className="flex justify-between bg-slate-400 p-1 shadow items-center space-x-4 sticky top-0 left-0 z-10">
                <div className="font-semibold">ID:</div>
                <div className="truncate text-ellipsis overflow-hidden text-right font-medium">
                    {taskDetails && taskDetails.id}
                </div>

            </div>

            {jsonData && Object.entries(jsonData).map(([section, fields]) => (
                <div className="space-y-2 bg-gray-100 p-2" key={section}>
                    {Array.isArray(fields) && fields.map((field: any) => (
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
                                        className="bg-white p-2 outline-none border border-gray-200 focus:border-red-400 focus:border-2 rounded-md transition w-full shadow-sm text-gray-700"
                                        onChange={(e) => {
                                            const newJsonData = { ...jsonData };
                                            const newField = { ...field, Value: { ...field.Value, Label: e.target.value } };
                                            newJsonData[section] = fields.map((f: any) => f.id === field.id ? newField : f);
                                            setJsonData(newJsonData);
                                        }}
                                    />
                                    {field.Value?.LabelBoundingBox && (
                                        <img
                                            src="/rect.png"
                                            alt="Draw Box"
                                            className="h-5 w-5 opacity-70 hover:opacity-100 transition hover:text-red-500"
                                        />
                                    )}
                                </div>

                                <div
                                    className="flex items-center gap-2"
                                    onClick={() =>
                                        setSelectedElement({
                                            section: section,
                                            id: field.id,
                                            target: "Value",
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
                                        className="bg-white p-2 outline-none border border-gray-200 focus:border-red-400 focus:border-2 rounded-md transition w-full shadow-sm text-gray-700"
                                        onChange={(e) => {
                                            const newJsonData = { ...jsonData };
                                            const newField = { ...field, Value: { ...field.Value, Text: e.target.value } };
                                            newJsonData[section] = fields.map((f: any) => f.id === field.id ? newField : f);
                                            setJsonData(newJsonData);
                                        }}
                                    />
                                    {field.Value?.BoundingBox && (
                                        <img
                                            src="/rect.png"
                                            alt="Draw Box"
                                            className="h-5 w-6"
                                        />



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
