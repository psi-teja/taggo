import axiosInstance from "./axiosInstance";

function genId(prefix: string) {
    try {
        // Try native crypto.randomUUID when available
        const uuid = (crypto as any)?.randomUUID?.();
        if (uuid) return uuid;
    } catch {}
    // Fallback
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
}

export function addIdsToJsonData(jsonData: any) {
    if (!jsonData || typeof jsonData !== "object") return jsonData;
    const newJsonData: any = {};

    Object.entries(jsonData).forEach(([section, fields]) => {
        // New table structure: { columns: [], rows: [] }
        if (fields && typeof fields === 'object' && Array.isArray((fields as any).rows)) {
            const table = fields as any;
            const columns = Array.isArray(table.columns) ? table.columns.map((col: any) => ({
                ...col,
                id: col?.id || genId('col'),
            })) : [];
            const rows = Array.isArray(table.rows) ? table.rows.map((row: any[]) =>
                Array.isArray(row)
                    ? row.map((cell: any) => ({
                        ...cell,
                        id: cell?.id || genId('cell'),
                    }))
                    : row
            ) : [];
            newJsonData[section] = { ...table, columns, rows };
            return;
        }

        if (Array.isArray(fields)) {
            // Check if array of arrays (legacy Table)
            if (fields.length > 0 && Array.isArray(fields[0])) {
                newJsonData[section] = (fields as any[]).map((row: any[]) =>
                    Array.isArray(row)
                        ? row.map((cell: any) => ({
                              ...cell,
                              id: cell?.id || genId('cell'),
                          }))
                        : row
                );
            }
            // Check if array of objects (General)
            else if (fields.length > 0 && typeof (fields as any)[0] === "object" && !Array.isArray((fields as any)[0])) {
                newJsonData[section] = (fields as any[]).map((field: any) => ({
                    ...field,
                    id: field?.id || genId('fld'),
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