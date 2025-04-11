import React, { useEffect, useState, useCallback, useRef } from "react";
import AddField from "./AddField";
import TextareaAutosize from "react-textarea-autosize";
import { BiComment } from "react-icons/bi";
import XIcon from "./XIcon";
import adjustTextareaHeight from "@/app/utils/adjustHeight";
import { Dispatch, SetStateAction } from 'react';

interface TableFieldsProps {
  allowReview: boolean;
  fieldName: string;
  fieldValue: any[];
  handleNestedFieldChange: (
    fieldType: string,
    index: number | null,
    field: string | null,
    nestedIndex: number | null,
    nestedColName: string | null,
    value: string | null,
    location: Record<string, any> | null,
    instruction: string
  ) => void;
  handleNestedRowDelete: (
    fieldName: string,
    rowIndex: number,
    colName: string | null,
    nestedIndex: number | null,
    isNestedTable: boolean
  ) => void;
  handleNestedRowAdd: (
    fieldName: string,
    rowIndex: number | null,
    colName: string | null,
    nestedRowIndex: number | null,
    isNestedTable: boolean
  ) => void;
  handleFieldClick: (
    fieldName: string,
    index: number | null,
    colName: string | null,
    location: Record<string, any>,
    nestedIndex: number | null,
    nestedColName: string | null,
    isNested: boolean,
    source?: string
  ) => void;
  isEdit: boolean;
  parentIndex?: number | null;
  parentFieldName?: string | null;
  isNested?: boolean;
}

interface DisplayCols {
  [key: string]: boolean;
}

const TableFields: React.FC<TableFieldsProps> = ({
  allowReview,
  fieldName,
  fieldValue,
  handleNestedFieldChange,
  handleNestedRowDelete,
  handleNestedRowAdd,
  handleFieldClick,
  isEdit,
  parentIndex = null,
  parentFieldName = null,
  isNested = false,
}) => {
  const [currIndex, setCurrIndex] = useState<number | null>(null);
  const [currField, setCurrField] = useState<string | null>(null);
  const [displayCols, setDisplayCols] = useState<DisplayCols>({});
  const textAreaFocused = useRef<boolean>(false);

  const changeCurr = (index: number, fieldName: string) => {
    setCurrIndex(index);
    setCurrField(fieldName);
  };

  const handleAddField = useCallback((fieldName: string) => {
    setDisplayCols((prevData) => {
      const newData = { ...prevData, [fieldName]: !prevData[fieldName] };
      return newData;
    });
  }, []);

  const handleSelectAll = useCallback(
    (selectAll: boolean) => {
      const newDisplayCols = Object.keys(displayCols).reduce(
        (acc, fieldName) => {
          acc[fieldName] = selectAll;
          return acc;
        },
        {} as DisplayCols
      );
      setDisplayCols(newDisplayCols);
    },
    [displayCols]
  );

  useEffect(() => {
    let predefinedFields: Record<string, boolean> = {};
    if (fieldName === "LedgerDetails") {
      predefinedFields = {
        LedgerName: true,
        LedgerDescription: false,
        LedgerRate: true,
        LedgerAmount: true,
      };
    } else if (fieldName === "Table") {
      predefinedFields = {
        ItemBox: true,
        ItemName: true,
        ItemDescription: true,
        HSNSACCode: true,
        BilledQty: true,
        BilledAltQty: false,
        ActualQty: false,
        ActualAltQty: false,
        DiscountAmount: false,
        DiscountRate: true,
        ItemRate: true,
        MRPRate: false,
        ItemRateUOM: true,
        BatchGodownDetails: true,
        BasicPkgMarks: false,
        BasicNumPkgs: false,
        SGSTRate: true,
        SGSTAmount: true,
        CGSTRate: true,
        CGSTAmount: true,
        IGSTRate: false,
        IGSTAmount: false,
        TaxRate: false,
        TaxAmount: false,
        ItemAmount: true,
        InclusiveTaxValue: true,
      };
    } else if (fieldName === "ROI") {
      predefinedFields = {
        Document_Info_block_pri: true,
        Buyer_address: true,
        Seller_address: true,
        Buyer_shipping: true,
        Table_pri: true,
        Table_sec: true,
        Amount_details: true,
        Total_amount: true,
        Document_Info_block_sec: true,
      };
    } else if (fieldName === "BatchGodownDetails") {
      predefinedFields = {
        BatchName: true,
        GodownName: true,
        BatchActualQty: false,
        BatchBilledQty: true,
        BatchRate: true,
        BatchItemRateUOM: true,
        BatchAmount: true,
        BatchExpiryDate: true,
        BatchMfgOn: true,
        BatchOrderNumber: false,
        BatchTrackingNumber: false,
        BatchDueOnDate: false,
      };
    }

    if (fieldValue.length !== 0) {
      const initialDisplayCols: DisplayCols = {};

      // Ensure all predefinedFields exist in every row, else add dummy value
      for (const field of Object.keys(predefinedFields)) {
        fieldValue.forEach((row: any) => {
          if (!row[field]) {
            if (field === "BatchGodownDetails") {
              fieldValue.forEach((row: any) => {
                row[field] = [{}];
              });
            } else {
              row[field] = {
                text: "",
                location: { pageNo: 0, ltwh: [0, 0, 0, 0, 0] },
              };
            }
          }
        });

        initialDisplayCols[field] = fieldValue.some(
          (row: any) =>
            row[field]?.text !== "" ||
            predefinedFields[field] ||
            row[field]?.comment
        );
      }
      setDisplayCols(initialDisplayCols);
    } else {
      //to ensure when no rows are present, column headers will be displayed 
      setDisplayCols(predefinedFields)
    }

  }, []);


  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (currIndex === null || currField === null || textAreaFocused.current)
        return;

      const rowCount = fieldValue.length;
      const colNames = Object.keys(displayCols).filter(
        (colName) => displayCols[colName]
      );

      let newIndex = currIndex;
      let newField = currField;

      if (e.key === "ArrowUp") {
        newIndex = currIndex > 0 ? currIndex - 1 : currIndex;
      } else if (e.key === "ArrowDown") {
        newIndex = currIndex < rowCount - 1 ? currIndex + 1 : currIndex;
      } else if (e.key === "ArrowLeft") {
        const currentColIndex = colNames.indexOf(currField);
        newField =
          currentColIndex > 0 ? colNames[currentColIndex - 1] : currField;
      } else if (e.key === "ArrowRight") {
        const currentColIndex = colNames.indexOf(currField);
        newField =
          currentColIndex < colNames.length - 1
            ? colNames[currentColIndex + 1]
            : currField;
      }

      if (newIndex !== currIndex || newField !== currField) {
        setCurrIndex(newIndex);
        setCurrField(newField);
        handleFieldClick(
          fieldName,
          newIndex,
          newField,
          fieldValue[newIndex]?.[newField]?.location || {
            pageNo: 0,
            ltwh: [0, 0, 0, 0, 0],
          },
          null,
          null,
          false
        );
      }
    },
    [currIndex, currField, displayCols, fieldValue, handleFieldClick, fieldName]
  );

  useEffect(() => {
    const handle = (e: KeyboardEvent) => handleKeyDown(e as any);
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [handleKeyDown]);

  const maxLength = (text: string) => {
    return text
      .split("\n")
      .reduce((max, line) => Math.max(max, line.length), 0);
  };

  const [rowVisibility, setRowVisibility] = useState<Record<number, boolean>>(
    {}
  );

  const toggleNestedTableVisibility = (index: number) => {
    setRowVisibility((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleFocusChange = (rowIndex: number, colName: string) => {
    if (colName !== "BatchGodownDetails") {
      setRowVisibility((prev) => ({
        ...prev,
        [rowIndex]: false,
      }));
    }
  };

  const renderNestedTable = (row: any, colName: string, rowIndex: number) => {
    const nestedTableData = row[colName];

    if (Array.isArray(nestedTableData)) {
      return (
        <TableFields
          allowReview={allowReview}
          fieldName={colName}
          fieldValue={nestedTableData}
          handleNestedFieldChange={handleNestedFieldChange}
          handleNestedRowDelete={handleNestedRowDelete}
          handleNestedRowAdd={handleNestedRowAdd}
          handleFieldClick={handleFieldClick}
          isEdit={isEdit}
          parentIndex={rowIndex}
          parentFieldName={fieldName}
          isNested={true}
        />
      );
    }
    return null;
  };

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; rowIndex: number } | null>(null);

  const handleContextMenu = (event: React.MouseEvent, rowIndex: number) => {
    event.preventDefault();
    setCurrIndex(rowIndex);
    const tdElement = event.currentTarget.getBoundingClientRect();
    const centerX = tdElement.left + tdElement.width / 2;
    const centerY = tdElement.top + tdElement.height / 2;
    setContextMenu({ x: centerX + 50, y: centerY + 50, rowIndex });
  };

  const handleCloseMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu) {
        handleCloseMenu();
      }
    };

    const handleEscPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscPress);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscPress);
    };
  }, [contextMenu]);

  return (
    <div
      className={`${isNested ? "h-[20vh]" : "h-[40vh]"}
        } overflow-y-auto text-xs custom-scrollbar`}
    >
      <table className="min-w-max max-w-full bg-white border-separate border-spacing-0">
        <thead
          className={`sticky top-0 bg-white ${!isNested ? "z-50" : "z-10"}`}
        >
          <tr>
            {isEdit && (
              <th
                className="sticky left-0 bg-white
              border border-gray-400
              whitespace-nowrap w-16"
              >
                <AddField
                  displayCols={displayCols}
                  handleAddField={handleAddField}
                  handleSelectAll={handleSelectAll}
                  isNested={isNested}
                />
              </th>
            )}

            {Object.entries(displayCols).map(
              ([fieldName, value]) =>
                value && (
                  <th
                    key={fieldName}
                    className={`
                      px-2 text-left 
                      border border-gray-400 
                      text-indigo-700 
                      ${contextMenu === null && fieldName === currField
                        ? isNested
                          ? "bg-blue-200"
                          : "bg-red-200"
                        : ""
                      }
                       min-w-[100px] `}
                  >
                    {fieldName}
                  </th>
                )
            )}
          </tr>
        </thead>
        <tbody>
          {fieldValue.map((row: any, index: number) => (
            <tr key={index} className={`m-2 p-2 `}>
              {isEdit && (
                <td
                  className={`sticky relative border border-gray-400 left-0 w-16 bg-gray-100 p-1 text-center p-2 cursor-pointer`}
                  onContextMenu={(event) => handleContextMenu(event, index)}
                >
                  <p className={`${contextMenu && index === currIndex ? "text-red-500" : ""}`}>
                    {index + 1}
                  </p>
                </td>

              )}

              {Object.entries(displayCols).map(
                ([colName, value]) =>
                  value && (
                    <td
                      key={colName}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFieldClick(
                          isNested ? parentFieldName ?? "" : fieldName,
                          isNested ? parentIndex : index,
                          isNested ? fieldName : colName,
                          row[colName]?.location,
                          isNested ? index : null,
                          isNested ? colName : null,
                          isNested
                        );
                        changeCurr(index, colName);
                        handleFocusChange(index, colName);
                        console.log(
                          "currField\n",
                          currField,
                          "currIndex\n",
                          currIndex
                        );
                      }}
                      className={`border 
                      ${contextMenu !== null && index === currIndex
                          ? isNested
                            ? "bg-blue-200"
                            : "bg-red-200" : ""
                        }
                      ${colName === currField && index === currIndex
                          ? isNested
                            ? "bg-blue-200"
                            : "bg-red-200"
                          : ""
                        } align-top  min-w-[100px]`}
                    >
                      {colName === "BatchGodownDetails" &&
                        Array.isArray(row[colName]) ? (
                        <>
                          {!rowVisibility[index] && (
                            <div className="flex justify-end items-center">
                              <button
                                onClick={() =>
                                  toggleNestedTableVisibility(index)
                                }
                                className={`px-2 py-1 m-1 rounded-lg shadow-md ${rowVisibility[index]
                                  ? "bg-blue-300 hover:bg-blue-600"
                                  : "bg-blue-400 hover:bg-blue-700"
                                  } text-white font-semibold focus:outline-none focus:ring-blue-500`}
                              >
                                <svg
                                  className={`w-5 h-5 ${rowVisibility[index]
                                    ? "transform rotate-180"
                                    : ""
                                    }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}

                          {rowVisibility[index] &&
                            renderNestedTable(row, colName, index)}
                        </>
                      ) : (
                        <>
                          <div className="flex">
                            {isEdit && row[colName]?.comment && (
                              <button
                                onClick={() =>
                                  handleNestedFieldChange(
                                    isNested
                                      ? parentFieldName ?? ""
                                      : fieldName,
                                    isNested ? parentIndex : index,
                                    isNested ? fieldName : colName,
                                    isNested ? index : null,
                                    isNested ? colName : null,
                                    "",
                                    null,
                                    "del comment"
                                  )
                                }
                                className="relative p-1 text-red-500"
                              >
                                <BiComment className="text-gray-700" />
                                <XIcon />
                              </button>
                            )}
                            {colName === currField &&
                              index === currIndex &&
                              allowReview &&
                              isEdit ? (
                              <TextareaAutosize
                                className="p-1 m-1 rounded-md border w-full border-blue-300 text-gray-800 px-2 bg-red-50 focus:outline-none resize-none hover:overflow-x-auto overflow-hidden hover:whitespace-nowrap custom-scrollbar"
                                value={row[colName].comment || ""}
                                placeholder="Add comment"
                                onChange={(e) => {
                                  if (isEdit) {
                                    handleNestedFieldChange(
                                      isNested
                                        ? parentFieldName ?? ""
                                        : fieldName,
                                      isNested ? parentIndex : index,
                                      isNested ? fieldName : colName,
                                      isNested ? index : null,
                                      isNested ? colName : null,
                                      e.target.value,
                                      null,
                                      "add comment"
                                    );
                                    adjustTextareaHeight(e.target);
                                  }
                                }}
                                rows={1} // Default row count
                                cols={maxLength(row[colName]?.comment || "")}
                                ref={(el) => {
                                  if (el) adjustTextareaHeight(el); // Adjust height on initial render
                                }}
                                wrap="off"
                                onFocus={handleCloseMenu}
                              />
                            ) : (
                              row[colName]?.comment && (
                                <div className="m-1 text-gray-800 text-left whitespace-nowrap overflow-x-hidden hover:overflow-x-auto hover:whitespace-nowrap custom-scrollbar">
                                  {row[colName].comment}
                                </div>
                              )
                            )}
                          </div>
                          <div className="flex">
                            {fieldName != "ROI" ? (
                              <TextareaAutosize
                                value={row[colName]?.text || ""}
                                className="p-2 m-1 rounded-md border w-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none hover:overflow-x-auto overflow-hidden hover:whitespace-nowrap custom-scrollbar"
                                onChange={(e) => {
                                  if (isEdit) {
                                    handleNestedFieldChange(
                                      isNested
                                        ? parentFieldName ?? ""
                                        : fieldName,
                                      isNested ? parentIndex : index,
                                      isNested ? fieldName : colName,
                                      isNested ? index : null,
                                      isNested ? colName : null,
                                      e.target.value,
                                      row[colName]?.location,
                                      "update value"
                                    );
                                    adjustTextareaHeight(e.target); // Adjust height dynamically
                                  }
                                }}
                                rows={1} // Default row count
                                ref={(el) => {
                                  if (el) adjustTextareaHeight(el); // Adjust height on initial render
                                }}
                                wrap="off"
                                cols={maxLength(row[colName]?.text || "")}
                                onFocus={() => {
                                  textAreaFocused.current = true
                                  handleCloseMenu();
                                }}
                                onBlur={() => (textAreaFocused.current = false)}
                                readOnly={!isEdit}
                              />
                            ) : (row[colName]?.location?.pageNo !== 0 ?
                              <p className="m-2 text-gray-800 text-left whitespace-nowrap">
                                occurance {index + 1}
                              </p>:null
                            )}

                            {row[colName]?.location?.pageNo !== 0 && isEdit && (
                              <button
                                onClick={() =>
                                  handleNestedFieldChange(
                                    isNested
                                      ? parentFieldName ?? ""
                                      : fieldName,
                                    isNested ? parentIndex : index,
                                    isNested ? fieldName : colName,
                                    isNested ? index : null,
                                    isNested ? colName : null,
                                    row[colName]?.text,
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
                                  className="h-4 w-5" // Adjust the height and width of the image as needed
                                />
                                {colName === currField &&
                                  index === currIndex && <XIcon />}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  )
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {isEdit && fieldValue.length === 0 && (
        <button
          className="pl-1 pr-1  m-2 font-bold text-black rounded hover:bg-green-700 hover:text-white focus:outline-none"
          onClick={() =>
            handleNestedRowAdd(
              isNested ? parentFieldName ?? "" : fieldName,
              isNested ? parentIndex : null,
              isNested ? fieldName : null,
              null,
              isNested
            )
          }
        >
          + Add Row
        </button>
      )}

      {contextMenu && (
        <Menu
          contextMenu={contextMenu}
          handleCloseMenu={handleCloseMenu}
          fieldName={fieldName}
          isNested={isNested}
          parentFieldName={parentFieldName}
          parentIndex={parentIndex}
          handleNestedRowAdd={handleNestedRowAdd}
          handleNestedRowDelete={handleNestedRowDelete}
          setCurrField={setCurrField} />
      )}

    </div >
  );
};


interface MenuProps {
  contextMenu: {
    x: number;
    y: number;
    rowIndex: number
  },
  handleCloseMenu: () => void,
  fieldName: string,
  parentFieldName?: string | null,
  parentIndex?: number | null,
  isNested: boolean;
  handleNestedRowAdd: (
    fieldName: string,
    rowIndex: number | null,
    colName: string | null,
    nestedRowIndex: number | null,
    isNestedTable: boolean
  ) => void;
  handleNestedRowDelete: (
    fieldName: string,
    rowIndex: number,
    colName: string | null,
    nestedIndex: number | null,
    isNestedTable: boolean
  ) => void;
  setCurrField: Dispatch<SetStateAction<string | null>>;
}

const Menu: React.FC<MenuProps> = ({
  contextMenu,
  handleCloseMenu,
  fieldName,
  parentFieldName,
  parentIndex,
  isNested,
  handleNestedRowAdd,
  handleNestedRowDelete,
  setCurrField,
}) => {
  return (
    <div
      className="absolute bg-white shadow-md border border-gray-300 rounded-md p-1"
      style={{
        top: contextMenu?.y,
        left: contextMenu?.x,
        transform: "translate(-50%, -50%)", // Center it over the td
        minWidth: "120px",
        zIndex: 100,
      }}
      onClick={handleCloseMenu} // Close menu when clicking anywhere
    >
      <button
        className="block w-full px-3 py-1 hover:bg-green-100 flex items-center"
        onClick={() => {
          handleNestedRowAdd(
            isNested ? parentFieldName ?? "" : fieldName,
            isNested ? parentIndex ?? 0 : contextMenu?.rowIndex,
            isNested ? fieldName : null,
            isNested ? contextMenu?.rowIndex ?? 0 : null,
            isNested
          )
          handleCloseMenu();
        }}
      >
        Add Above
      </button>
      <button
        className="block w-full px-3 py-1 hover:bg-green-100 flex items-center"
        onClick={() => {
          handleNestedRowAdd(
            isNested ? parentFieldName ?? "" : fieldName,
            isNested ? parentIndex ?? 0 : contextMenu?.rowIndex + 1,
            isNested ? fieldName : null,
            isNested ? (contextMenu?.rowIndex ?? 0) + 1 : null,
            isNested
          );
          handleCloseMenu();
        }}
      >
        Add Below
      </button>
      <button
        className="block w-full px-3 py-1 text-red-600 hover:bg-red-100 flex items-center"
        onClick={() => {
          handleNestedRowDelete(
            isNested ? parentFieldName ?? "" : fieldName,
            isNested ? parentIndex ?? 0 : contextMenu?.rowIndex,
            isNested ? fieldName : null,
            isNested ? contextMenu?.rowIndex : null,
            isNested
          )
          handleCloseMenu();
          setCurrField(null);
        }}
      >
        Delete
      </button>
    </div>
  )
}

export default TableFields;
