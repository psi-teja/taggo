import axiosInstance from "./axiosInstance";

export function addIdsToJsonData(jsonData: any) {
    if (!jsonData || typeof jsonData !== "object") return jsonData;
    const newJsonData: any = {};

    Object.entries(jsonData).forEach(([section, fields]) => {
        // Handle arrays (like General, Table, LedgerDetails, BillDetails)
        if (Array.isArray(fields)) {
            // For Table and LedgerDetails, check for objects with LineItems
            if (
                (section != "General") &&
                fields.every((item: any) => typeof item === "object" && item !== null)
            ) {
                newJsonData[section] = fields.map((item: any) => {
                    const newItem = { ...item, id: item.id || crypto.randomUUID() };
                    // If LineItems is an array, add ids to each LineItem
                    if (Array.isArray(newItem.LineItems)) {
                        newItem.LineItems = newItem.LineItems.map((lineItem: any) => ({
                            ...lineItem,
                            id: lineItem.id || crypto.randomUUID(),
                        }));
                    }
                    // If BatchGodownDetails is an array of arrays, add ids to each subitem
                    if (Array.isArray(newItem.BatchGodownDetails)) {
                        newItem.BatchGodownDetails = newItem.BatchGodownDetails.map((batchArr: any) => {
                            if (Array.isArray(batchArr)) {
                                return batchArr.map((batchItem: any) => ({
                                    ...batchItem,
                                    id: batchItem?.id || crypto.randomUUID(),
                                }));
                            }
                            return batchArr;
                        });
                    }
                    return newItem;
                });
            } else {
                // For General or other arrays
                newJsonData[section] = fields.map((field: any) => {
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