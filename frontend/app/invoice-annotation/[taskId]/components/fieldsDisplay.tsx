import { useEffect, useState } from "react";

interface FieldsDisplayProps {
    taskDetails?: { id?: string | number };
    jsonData: any;
    setJsonData: React.Dispatch<React.SetStateAction<any>>;
    handleFieldClick: (element: any) => void;
}


const FieldsDisplay: React.FC<FieldsDisplayProps> = ({ taskDetails, jsonData, setJsonData, handleFieldClick }) => {

    if (!jsonData) {
        return (
            <div className="relative inset-0 flex items-center justify-center bg-white bg-opacity-75 h-screen w-full">
                <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
            </div>
        );
    }

    const [selectedID, setSelectedID] = useState<string | null>(null);

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
                    <div className="font-bold mb-2">{section}</div>
                    <div className="space-y-2">
                        {Array.isArray(fields) && fields.map((field: any) => (
                            <div key={field.id} className="bg-white rounded-lg shadow p-2 flex flex-col gap-2">
                                <div className="items-center gap-2">
                                    <p className="text-gray-600 font-semibold min-w-[120px]">{field.Name}</p>
                                    <div>
                                        <input
                                            type="text"
                                            value={field.Value?.Label || ""}
                                            placeholder="label"
                                            className="bg-white p-2 outline-none border border-gray-300 focus:border-blue-500 rounded transition w-full shadow-sm"
                                            readOnly
                                        />
                                        {field.Value?.LabelBoundingBox && (
                                            <img
                                            src="/rect.png"
                                            alt="Draw Box"
                                            className="h-5 w-5 ml-2 opacity-80 hover:opacity-100 transition"
                                        />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        value={field.Value?.Text || ""}
                                        placeholder="value"
                                        className="bg-white p-2 outline-none border border-gray-300 focus:border-blue-500 rounded transition w-full shadow-sm"
                                        readOnly
                                    />
                                    {field.Value?.BoundingBox && (
                                            <img
                                            src="/rect.png"
                                            alt="Draw Box"
                                            className="h-4 w-4 ml-2 opacity-80 hover:opacity-100 transition"
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
