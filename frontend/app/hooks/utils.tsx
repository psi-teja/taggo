import axiosInstance from "./axiosInstance";

export function addIdsToJsonData(jsonData: any) {
    if (!jsonData || typeof jsonData !== "object") return jsonData;
    const newJsonData: any = {};
    Object.entries(jsonData).forEach(([section, fields]) => {
        if (Array.isArray(fields)) {
            newJsonData[section] = fields.map((field: any) => {
                // Add id to label and value if they exist and are objects
                const newField = {
                    ...field,
                    id: field.id || crypto.randomUUID(),
                };
                if (newField.label && typeof newField.label === "object") {
                    newField.label = {
                        ...newField.label,
                        id: newField.label.id || crypto.randomUUID(),
                    };
                }
                if (newField.value && typeof newField.value === "object") {
                    newField.value = {
                        ...newField.value,
                        id: newField.value.id || crypto.randomUUID(),
                    };
                }
                return newField;
            });
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