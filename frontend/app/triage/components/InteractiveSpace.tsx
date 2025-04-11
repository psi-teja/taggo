import { useState, useEffect } from "react";
import DocViewer from "@/app/triage/components/DocViewer";
import ExtractedFields from "@/app/triage/components/ExtractedFields";
import axiosInstance from "@/app/utils/axiosInstance";

interface InteractiveSpaceProps {
  doc_id: string;
  status: string;
  handleNextClick: () => void;
  isEdit: boolean;
}

const InteractiveSpace: React.FC<InteractiveSpaceProps> = ({
  doc_id,
  status,
  handleNextClick,
  isEdit,
}) => {
  const [boxLocation, setBoxLocation] = useState<Record<string, any> | null>(
    null
  );
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [colName, setColName] = useState<string | null>(null);
  const [view, setView] = useState("General");

  const [selectedNestedRow, setSelectedNestedRow] = useState<number | null>(
    null
  );
  const [nestedColName, setNestedColName] = useState<string | null>(null);
  const [nestedBoxLocation, setNestedBoxLocation] = useState<Record<
    string,
    any
  > | null>(null);

  const [extractedData, setExtractedData] = useState<{
    [key: string]: any;
  } | null>(null);

  const [noData, setNoData] = useState(false);
  const [triageLoading, setTriageLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [dataChanged, setDataChanged] = useState(false);

  const handleSingleValuedFieldChange = (
    fieldName: string | null,
    value: string | null,
    location: Record<string, any> | null,
    instruction: string
  ) => {
    if (!fieldName) {
      return;
    }

    setExtractedData((prevValues: { [key: string]: any }) => {
      const newData = { ...prevValues };
      const fieldLevels = fieldName.split(".");
      let currentLevel = newData;
      for (let i = 0; i < fieldLevels.length - 1; i++) {
        const level = fieldLevels[i];
        currentLevel[level] = { ...(currentLevel[level] || {}) };
        currentLevel = currentLevel[level];
      }
      if (instruction === "update value") {
        currentLevel[fieldLevels[fieldLevels.length - 1]].text = value
          ? value
          : "";
      }
      if (instruction === "add bbox" || instruction === "del bbox") {
        currentLevel[fieldLevels[fieldLevels.length - 1]].location = location
          ? location
          : { pageNo: 0, ltwh: [0, 0, 0, 0] };

        setBoxLocation(location);
      }
      if (instruction === "add comment" || instruction === "del comment") {
        currentLevel[fieldLevels[fieldLevels.length - 1]].comment = value
          ? value
          : "";
      }
      return newData;
    });
    setDataChanged(true);
  };

  const handleNestedFieldChange = (
    fieldName: string,
    index: number | null,
    colName: string | null,
    nestedIndex: number | null = null,
    nestedColName: string | null = null,
    value: string | null,
    location: Record<string, any> | null,
    instruction: string
  ) => {
    if (index == null || !colName) {
      return;
    }

    console.log(
      "handleNestedFieldChange\n",
      "\nfieldName",
      fieldName,
      "\nindex",
      index,
      "\ncolName",
      colName,
      "\nnestedIndex",
      nestedIndex,
      "\nnestedColName",
      nestedColName,
      "\nlocation",
      location,
      "\nvalue",
      value,
      "\ninstruction",
      instruction
    );

    setExtractedData((prevData) => {
      const newData = { ...prevData };
      const updatedItem = { ...newData[fieldName][index] };

      const nestedField = updatedItem[colName];

      if (Array.isArray(nestedField) && nestedColName && nestedIndex !== null) {
        const nestedRow = nestedField[nestedIndex];

        if (instruction === "update value") {
          nestedField[nestedIndex] = {
            ...nestedRow,
            [nestedColName]: {
              ...nestedRow[nestedColName],
              text: value ? value : "",
            },
          };
        }

        if (instruction === "add bbox" || instruction === "del bbox") {
          console.log("add box nested");
          nestedField[nestedIndex] = {
            ...nestedRow,
            [nestedColName]: {
              ...nestedRow[nestedColName],
              location: location ? location : { pageNo: 0, ltwh: [0, 0, 0, 0] },
            },
          };
          setBoxLocation(location);
        }

        if (instruction === "add comment") {
          nestedField[nestedIndex] = {
            ...nestedRow,
            [nestedColName]: {
              ...nestedRow[nestedColName],
              comment: value ? value : "",
            },
          };
        }

        if (instruction === "del comment") {
          nestedField[nestedIndex] = {
            ...nestedRow,
            [nestedColName]: {
              ...nestedRow[nestedColName],
              comment: "",
            },
          };
        }

        updatedItem[colName] = [...nestedField];
        console.log("updateitem", updatedItem);
      } else {
        if (instruction === "update value") {
          updatedItem[colName] = {
            ...updatedItem[colName],
            text: value ? value : "",
          };
        }
        if (instruction === "add bbox" || instruction === "del bbox") {
          console.log("add box not nested");
          updatedItem[colName] = {
            ...updatedItem[colName],
            location: location ? location : { pageNo: 0, ltwh: [0, 0, 0, 0] },
          };
          setBoxLocation(location);
        }
        if (instruction === "add comment") {
          updatedItem[colName] = {
            ...updatedItem[colName],
            comment: value ? value : "",
          };
        }
        if (instruction === "del comment") {
          updatedItem[colName] = {
            ...updatedItem[colName],
            comment: "",
          };
        }
      }
      newData[fieldName][index] = updatedItem;
      return newData;
    });
    setDataChanged(true);
  };

  const handleNestedRowDelete = (
    fieldName: string,
    rowIndex: number,
    colName: string | null,
    nestedIndex: number | null,
    isNestedTable: boolean | null
  ) => {
    setExtractedData((prevData) => {
      const newData = { ...prevData };
      const updatedTable = [...newData[fieldName]];

      if (isNestedTable && colName && nestedIndex !== null) {
        const nestedTable = [...updatedTable[rowIndex][colName]];

        if (Array.isArray(nestedTable)) {
          nestedTable.splice(nestedIndex, 1);
          updatedTable[rowIndex] = {
            ...updatedTable[rowIndex],
            [colName]: nestedTable,
          };
        }
      } else {
        updatedTable.splice(rowIndex, 1);
      }

      newData[fieldName] = updatedTable;
      return newData;
    });

    setDataChanged(true);
  };

  const handleNestedRowAdd = (
    fieldName: string,
    rowIndex: number | null,
    colName: string | null,
    nestedRowIndex: number | null,
    isNestedTable: boolean | null
  ) => {
    setExtractedData((prevData) => {
      const newData = { ...prevData };
      const updatedTable = [...newData[fieldName]];

      if (isNestedTable && colName && rowIndex !== null) {
        const nestedTable = [...updatedTable[rowIndex][colName]];
        let newNestedRow: { [key: string]: any } = {};

        for (const field in nestedTable[0]) {
          if (Array.isArray(nestedTable[0][field])) {
            newNestedRow[field] = [{}];
          } else {
            newNestedRow[field] = {
              text: "",
              location: {
                pageNo: 0,
                ltwh: [0, 0, 0, 0],
              },
            };
          }
        }

        if (nestedRowIndex !== null) {
          nestedTable.splice(nestedRowIndex, 0, newNestedRow);
        } else {
          nestedTable.push(newNestedRow);
        }

        updatedTable[rowIndex] = {
          ...updatedTable[rowIndex],
          [colName]: nestedTable,
        };
      } else {
        const newRow: { [key: string]: any } = {};
        for (const field in updatedTable[0]) {
          if (Array.isArray(updatedTable[0][field])) {
            newRow[field] = [{}];
          } else {
            newRow[field] = {
              text: "",
              location: {
                pageNo: 0,
                ltwh: [0, 0, 0, 0],
              },
            };
          }
        }
        if (rowIndex !== null) {
          // Insert row before the current rowIndex
          updatedTable.splice(rowIndex, 0, newRow);
        } else {
          updatedTable.push(newRow);
        }
      }

      newData[fieldName] = updatedTable;
      return newData;
    });

    setDataChanged(true);
  };

  const handleAccept = async () => {
    setActionPending(true);
    try {
      const response = await axiosInstance.post(
        `/accept/${status}/${doc_id}/`,
        JSON.stringify(extractedData)
      );

      if (response.status >= 200 && response.status < 300) {
        setDataChanged(false);
        setNoData(false);
        handleNextClick();
      } else {
        console.error("Failed to accept");
      }
    } catch (error) {
      console.error("Error accepting:", error);
    }
    setActionPending(false);
  };

  const handleSubmit = async () => {
    setActionPending(true);
    let commentList = [];
    for (const field in extractedData) {
      if (Array.isArray(extractedData[field])) {
        for (const item of extractedData[field]) {
          for (const subField in item) {
            if (item[subField].comment) {
              commentList.push(
                `${field}[${subField}]: ${item[subField].comment}`
              );
            }
          }
        }
      } else if (extractedData[field].comment) {
        commentList.push(`${field}: ${extractedData[field].comment}`);
      }
    }

    if (commentList.length > 0) {
      setActionPending(false);
      alert(
        "Please remove all comment before rejecting:\n" + commentList.join("\n")
      );
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/submit/${status}/${doc_id}/`,
        JSON.stringify(extractedData)
      );

      if (response.status >= 200 && response.status < 300) {
        setDataChanged(false);
        setNoData(false);
        handleNextClick();
      } else {
        console.error("Failed to submit");
      }
    } catch (error) {
      console.error("Error submitting:", error);
    }
    setActionPending(false);
  };

  const handleReject = async () => {
    setActionPending(true);
    let commentList = [];
    for (const field in extractedData) {
      if (Array.isArray(extractedData[field])) {
        for (const item of extractedData[field]) {
          for (const subField in item) {
            if (item[subField].comment) {
              commentList.push(
                `${field}[${subField}]: ${item[subField].comment}`
              );
            }
          }
        }
      } else if (extractedData[field].comment) {
        commentList.push(`${field}: ${extractedData[field].comment}`);
      }
    }

    if (commentList.length == 0) {
      setActionPending(false);
      alert("Please add a comment before rejecting");
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/reject/${status}/${doc_id}/`,
        JSON.stringify(extractedData)
      );

      if (response.status >= 200 && response.status < 300) {
        setDataChanged(false);
        setNoData(false);
        handleNextClick();
      } else {
        console.error("Failed to reject");
      }
    } catch (error) {
      console.error("Error rejecting:", error);
    }
    setActionPending(false);
  };

  const handleMoveToCompleted = async () => {

    setActionPending(true);
    try {
      const response = await axiosInstance.post(
        `/move_to_completed/${status}/${doc_id}/`,
        JSON.stringify(extractedData)
      );

      if (response.status >= 200 && response.status < 300) {
        console.log("Document marked as completed successfully");
        setDataChanged(false);
        setNoData(false);
        handleNextClick();
      } else {
        console.error("Failed to mark document as completed");
      }
    } catch (error) {
      console.error("Error marking as completed:", error);
    }
  };

  const handleSave = async () => {
    console.log("handleSave extractedData", extractedData);
    try {
      const response = await axiosInstance.post(
        `save/${status}/${doc_id}/`,
        JSON.stringify(extractedData)
      );

      if (response.status >= 200 && response.status < 300) {
        console.log("Data saved successfully");
        setDataChanged(false);
        setNoData(false);
      } else {
        console.error("Failed to save data");
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
    setActionPending(false);
  };

  const fetchData = async () => {
    setTriageLoading(true);

    try {
      const response = await axiosInstance.get(`/get_json/${status}/${doc_id}`);
      const data = await response.data.data;
      if (data && !data.detail) {
        setExtractedData(data);
        setDataChanged(false);
      } else {
        setExtractedData(null);
        setNoData(true);
      }
      setTriageLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setTriageLoading(false);
    }
  };
  const handleReset = async () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [doc_id]);

  const handleFieldClick = (
    fieldName: string,
    index: number | null,
    colName: string | null,
    location: Record<string, any>,
    nestedIndex: number | null,
    nestedColName: string | null,
    isNested: boolean = false
  ) => {
    if (location?.pageNo !== 0) {
      setBoxLocation(location);
    } else {
      setBoxLocation(null);
    }

    if (isNested) {
      setSelectedNestedRow(nestedIndex);
      setNestedColName(nestedColName);
    }

    setSelectedRow(index);
    setSelectedField(fieldName);
    setColName(colName);
  };

  const handleChangeView = (viewType: string) => {
    setView(viewType);
    setSelectedField(null);
  };

  const startAnnotation = () => {
    setExtractedData({});
    setNoData(false);
  };

  return (
    <div className={`overflow-hidden flex-1 h-full ${view === "General" ? "flex" : ""}`}>
      <DocViewer
        doc_id={doc_id}
        boxLocation={boxLocation}
        viewType={view}
        handleSingleValuedFieldChange={handleSingleValuedFieldChange}
        handleNestedFieldChange={handleNestedFieldChange}
        selectedField={selectedField}
        selectedRow={selectedRow}
        colName={colName}
        selectedNestedRow={selectedNestedRow}
        nestedColName={nestedColName}
        dataChanged={dataChanged}
      />

      <ExtractedFields
        doc_id={doc_id}
        status={status}
        startAnnotation={startAnnotation}
        handleFieldClick={handleFieldClick}
        handleChangeView={handleChangeView}
        viewType={view}
        selectedField={selectedField}
        extractedData={extractedData}
        handleSingleValuedFieldChange={handleSingleValuedFieldChange}
        handleNestedFieldChange={handleNestedFieldChange}
        handleNestedRowDelete={handleNestedRowDelete}
        handleNestedRowAdd={handleNestedRowAdd}
        triageLoading={triageLoading}
        actionPending={actionPending}
        nodata={noData}
        dataChanged={dataChanged}
        handleSave={handleSave}
        handleReset={handleReset}
        handleSubmit={handleSubmit}
        handleAccept={handleAccept}
        handleReject={handleReject}
        handleMoveToCompleted={handleMoveToCompleted}
        isEdit={isEdit}
      />
    </div>
  );
};

export default InteractiveSpace;
