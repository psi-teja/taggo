import { useEffect } from "react";

interface FieldsDisplayProps {
    taskDetails?: { id?: string | number };
    jsonData: any;
    setJsonData: React.Dispatch<React.SetStateAction<any>>;
}

function addIdsToJsonData(jsonData: any) {
    if (!jsonData || typeof jsonData !== "object") return jsonData;
    const newJsonData: any = {};
    Object.entries(jsonData).forEach(([section, fields]) => {
        if (Array.isArray(fields)) {
            newJsonData[section] = fields.map((field: any) => ({
                ...field,
                id: field.id || crypto.randomUUID(),
            }));
        } else {
            newJsonData[section] = fields;
        }
    });
    return newJsonData;
}

const FieldsDisplay: React.FC<FieldsDisplayProps> = ({ taskDetails, jsonData, setJsonData }) => {
    
    if (!jsonData) {
        return (
            <div className="relative inset-0 flex items-center justify-center bg-white bg-opacity-75 h-screen w-full">
                <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
            </div>
        );
    }
    
    useEffect(() => {
        if (jsonData) {
            const updatedJsonData = addIdsToJsonData(jsonData);
            setJsonData(updatedJsonData);
        }
    }, []);


    console.log("jsonData", jsonData);

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
                            <div key={field.id} className="bg-white p-2 rounded shadow">
                                <div className="flex items-center gap-2 mb-2">
                                    <p className="text-gray-600 font-semibold min-w-[48px]">Label:</p>
                                    <input
                                        type="text"
                                        value={field.label?.text || ""}
                                        placeholder="Label"
                                        className="bg-white p-2 outline-none border border-gray-300 focus:border-blue-500 rounded transition w-full shadow-sm"
                                    />
                                    {field.label?.location && (
                                        <img
                                            src="/rect.png"
                                            alt="Draw Box"
                                            className="h-5 w-5 ml-2 opacity-80 hover:opacity-100 transition"
                                        />
                                    )}
                                </div>
                                <div className="text-gray-700">
                                    <input
                                        type="text"
                                        value={field.value?.text || ""}
                                        placeholder="value"
                                        className="bg-transparent p-2 outline-none w-full border border-gray-300 focus:border-blue-500 rounded"
                                    />
                                </div>
                                <select
                                    value={field.mapsTo[0] || "text"}>
                                    <option value="text">Text</option>
                                    <option value="checkbox">Checkbox</option>
                                    <option value="dropdown">Dropdown</option>
                                    <option value="radio">Radio</option>
                                </select>
                                <small className="text-xs text-gray-400">{field.id}</small>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FieldsDisplay;
