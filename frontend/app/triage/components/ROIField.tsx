import React, { useEffect, useState } from "react";
import AddField from "./AddField";
import { BiComment } from "react-icons/bi";
import TextareaAutosize from "react-textarea-autosize";
import XIcon from "./XIcon";


interface ROIFieldsProps {
  allowReview: boolean;
  fieldName: string;
  fieldValue: any;
  handleNestedFieldChange: (
    fieldType: string,
    index: number | null,
    field: string | null,
    value: string | null,
    location: Record<string, any> | null,
    instruction: string
  ) => void;
  handleNestedRowDelete: (fieldName: string, index: number) => void;
  handleNestedRowAdd: (fieldName: string) => void;
  handleFieldClick: (
    fieldName: string,
    index: number | null,
    colName: string | null,
    location: Record<string, any>
  ) => void;
}

interface DisplayCols {
  [key: string]: boolean;
}

const ROIFields: React.FC<ROIFieldsProps> = ({
  allowReview,
  fieldName,
  fieldValue,
  handleNestedFieldChange,
  handleNestedRowDelete,
  handleNestedRowAdd,
  handleFieldClick,
}) => {
  const [currIndex, setCurrIndex] = useState<number | null>(null);
  const [currField, setCurrField] = useState<string | null>(null);
  const [displayCols, setDisplayCols] = useState<DisplayCols>({});

  const changeCurr = (index: number, fieldName: string) => {
    setCurrIndex(index);
    setCurrField(fieldName);
  };

  const handleAddField = (fieldName: string) => {
    setDisplayCols((prevData) => {
      if (prevData === null) {
        return { [fieldName]: true };
      }
      const newData = { ...prevData, [fieldName]: !prevData[fieldName] };
      return newData;
    });
  };

  const handleSelectAll = (selectAll: boolean) => {
    const newDisplayCols = Object.keys(displayCols).reduce((acc, fieldName) => {
      acc[fieldName] = selectAll;
      return acc;
    }, {} as DisplayCols);
    setDisplayCols(newDisplayCols);
  };

  useEffect(() => {
    let predefinedFields: Record<string, boolean> = {};

    if (fieldName === "LedgerDetails") {
      predefinedFields = {"LedgerName": true, "LedgerRate":true, "LedgerAmount":true};
    } else {
      predefinedFields = {
        "Document_Info_block_pri":true,
        "Buyer_address":true,
        "Seller_address":true,
        "Buyer_shipping":true,
        "Table_pri":true,
        "Table_sec":true,
        "Amount_details":true,
        "Total_amount":true,
        "Document_Info_block_sec":true,
      };
    }

    const initialDisplayCols: DisplayCols = {};

    // Ensure all predefinedFields exist in every row, else add dummy value
    for (const field of Object.keys(predefinedFields)) {
      fieldValue.forEach((row: any) => {
        if (!row[field]) {
          row[field] = {
            text: "",
            location: { pageNo: 0, ltwh: [0, 0, 0, 0, 0] },
          };
        }
      });

      initialDisplayCols[field] = fieldValue.some(
        (row: any) => row[field]?.text !== "" || row[field]?.comment !== "" || row[field]?.location?.pageNo !== 0
      );
    }

    setDisplayCols(initialDisplayCols);
  }, [fieldName]);

  return (
    <div className="h-[25vh] overflow-auto">
      <table className="min-w-full bg-white">
        <thead className="sticky top-0 z-10">
          <tr className="">
            <th className="sticky left-0 bg-gray-300">
              <AddField
                displayCols={displayCols}
                handleAddField={handleAddField}
                handleSelectAll={handleSelectAll}
              />
            </th>
            {Object.entries(displayCols).map(
              ([fieldName, value]) =>
                value && (
                  <th
                    key={fieldName}
                    className={`px-2 text-left border-r font-medium text-sm ${fieldName === currField
                        ? "bg-cyan-300"
                        : "bg-blue-500 text-white"
                      }`}
                  >
                    {fieldName}
                  </th>
                )
            )}
          </tr>
        </thead>
        <tbody>
          {fieldValue.map((row: any, index: number) => (
            <tr
              key={index}
              className={`p-0 border-b ${index === currIndex ? "" : ""}`}
            >
              <td
                className={`sticky left-0 ${index === currIndex ? "bg-cyan-300" : "bg-gray-300"
                  }`}
              >
                <button
                  className={`px-3 text-xl font-bold rounded hover:bg-red-500 text-black focus:outline-none hover:text-white`}
                  onClick={(e) => handleNestedRowDelete(fieldName, index)}
                >
                  -
                </button>
              </td>
              {Object.entries(displayCols).map(
                ([colName, value]) =>
                  value && (
                    <td
                      key={colName}
                      onFocus={() => {
                        handleFieldClick(
                          fieldName,
                          index,
                          colName,
                          row[colName].location
                        );
                        changeCurr(index, colName);
                      }}
                      onClick={() => {
                        handleFieldClick(
                          fieldName,
                          index,
                          colName,
                          row[colName].location
                        );
                        changeCurr(index, colName);
                      }}
                      className={`p-0 border-r ${colName === currField && index === currIndex
                          ? "bg-red-200"
                          : ""
                        }`}
                    >
                      {row[colName]?.location?.pageNo !== 0 && (
                        <div className="flex justify-center">
                          <p className="m-2 text-gray-800 text-left whitespace-nowrap">page {index + 1}</p>
                          <button
                            onClick={(e) =>
                              handleNestedFieldChange(
                                fieldName,
                                index,
                                colName,
                                row[colName].text,
                                null,
                                "del bbox"
                              )
                            }
                            disabled={
                              colName !== currField || index !== currIndex
                            }
                            className="relative"
                          >
                            <img
                              src="rect.png" // Replace with the actual path to your PNG image
                              alt="Draw Box"
                              className="h-4 w-5 m-2" // Adjust the height and width of the image as needed
                            />
                            {colName === currField && index === currIndex && (
                              <XIcon />
                            )}
                          </button>
                          {(colName === currField && index === currIndex && allowReview) ?
                            <TextareaAutosize
                              className="text-gray-800 bg-blue-50 rounded-md border overflow-hidden resize-none border-blue-300 p-2 focus:outline-none w-full"
                              value={row[colName].comment || ""}
                              placeholder="Add comment"
                              onChange={(e) => {
                                handleNestedFieldChange(
                                  fieldName,
                                  index,
                                  colName,
                                  e.target.value,
                                  null,
                                  "add comment"
                                )
                              }
                              }
                              rows={1} // Default row count
                              wrap="off"
                            /> :
                            row[colName].comment ? (
                              <div className="flex items-center">
                                <BiComment className="text-gray-700" />
                              </div>
                            ) : null}
                        </div>
                      )} 
                      
                    </td>
                  )
              )}
            </tr>
          ))}
        </tbody>
      </table>
       <button
        className="p-1 m-2 font-bold text-black rounded hover:bg-green-700 hover:text-white focus:outline-none"
        onClick={(e) => handleNestedRowAdd(fieldName)}
      >
        + Add Row
      </button>
    </div>
  );
};

export default ROIFields;
