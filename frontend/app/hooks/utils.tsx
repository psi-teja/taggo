import axiosInstance from "./axiosInstance";

export function addIdsToJsonData(jsonData: any) {
    if (!jsonData || typeof jsonData !== "object") return jsonData;
    const newJsonData: any = {};

    Object.entries(jsonData).forEach(([section, fields]) => {
        if (Array.isArray(fields)) {
            // Check if array of arrays (Table)
            if (fields.length > 0 && Array.isArray(fields[0])) {
                newJsonData[section] = fields.map((row: any[]) =>
                    Array.isArray(row)
                        ? row.map((cell: any) => ({
                              ...cell,
                              id: cell.id || crypto.randomUUID(),
                          }))
                        : row
                );
            }
            // Check if array of objects (General)
            else if (fields.length > 0 && typeof fields[0] === "object" && !Array.isArray(fields[0])) {
                newJsonData[section] = fields.map((field: any) => ({
                    ...field,
                    id: field.id || crypto.randomUUID(),
                }));
            }
            // For other arrays, just copy as is
            else {
                newJsonData[section] = fields;
            }
        } else {
            newJsonData[section] = fields;
        }
    });

    return newJsonData;
}

export async function saveJsonData (jsonData: any, taskDetails: any) {
    console.log("Saving JSON data:", jsonData);
    try {
        await axiosInstance.post(
            `/save_json_data/`,
            {
                taskId: taskDetails.id,
                taskType: taskDetails.task_type,
                jsonData: jsonData,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (error) {
        console.error("Error saving JSON data:", error);
    }
};