import React, { useState, useEffect, useCallback } from "react";
import TableFields from "./TableFields";
import SingleValuedField from "./SingleValuedField";
import ToggleView from "./ToggleView";
import { FaExclamationCircle } from "react-icons/fa";
import AddField from "./AddField";
import ActionButtons from "./ActionButtons";

const predefinedFields = {
  SupplierName: true,
  SupplierAddress: true,
  SupplierContactNo: true,
  SupplierEmail: true,
  SupplierGSTIN: true,
  SupplierPAN: true,
  SupplierState: true,
  ConsigneeName: true,
  ConsigneeAddress: true,
  ConsigneeContactNo: true,
  ConsigneeEmail: true,
  ConsigneeGSTIN: true,
  ConsigneePAN: true,
  ConsigneeState: true,
  BuyerName: true,
  BuyerAddress: true,
  BuyerContactNo: true,
  BuyerEmail: true,
  BuyerGSTIN: true,
  BuyerOrderDate: true,
  BuyerPAN: true,
  BuyerState: true,
  InvoiceNumber: true,
  EWayBillNumber: false,
  InvoiceDate: true,
  EWayBillDate: false,
  Destination: true,
  DispatchThrough: true,
  DocumentType: false,
  OrderNumber: true,
  OtherReference: true,
  PortofLoading: false,
  ReferenceNumber: true,
  ReferenceDate: true,
  TermsofPayment: true,
  SubAmount: true,
  TotalAmount: true,
  BasicShipDocumentNo: false,
  Table: false,
  LedgerDetails: false,
  ROI: false,
};

interface ExtractedFieldsProps {
  doc_id: string | null;
  status: string;
  startAnnotation: () => void;
  handleFieldClick: (
    fieldName: string,
    index: number | null,
    colName: string | null,
    location: Record<string, any>,
    nestedIndex: number | null,
    nestedColName: string | null,
    isNested: boolean
  ) => void;
  handleChangeView: (viewType: string) => void;
  viewType: string;
  selectedField: string | null;
  extractedData: { [key: string]: any } | null;
  handleSingleValuedFieldChange: (
    fieldName: string,
    value: string | null,
    location: Record<string, any> | null,
    instruction: string
  ) => void;
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
  triageLoading: boolean;
  actionPending: boolean;
  nodata: boolean;
  dataChanged: boolean;
  handleSave: () => void;
  handleReset: () => void;
  handleSubmit: () => void;
  handleAccept: () => void;
  handleReject: () => void;
  handleMoveToCompleted: () => void;
  isEdit: boolean;
}

interface DisplayFields {
  [key: string]: boolean;
}

const ExtractedFields: React.FC<ExtractedFieldsProps> = ({
  doc_id,
  status,
  startAnnotation,
  handleFieldClick,
  handleChangeView,
  viewType,
  selectedField,
  extractedData,
  handleSingleValuedFieldChange,
  handleNestedFieldChange,
  handleNestedRowDelete,
  handleNestedRowAdd,
  triageLoading,
  actionPending,
  dataChanged,
  handleSave,
  handleReset,
  handleSubmit,
  handleAccept,
  handleReject,
  handleMoveToCompleted,
  isEdit,
}) => {
  const [displayFields, setDisplayFields] = useState<DisplayFields>({});
  const [allowReview, setAllowReview] = useState<boolean>(false);

  useEffect(() => {
    const initialDisplayFields: DisplayFields = {};

    if (extractedData == null) {
      return;
    }

    Object.keys(predefinedFields).forEach((field) => {
      if (!extractedData[field]) {
        if (field === "Table" || field === "LedgerDetails" || field == "ROI") {
          extractedData[field] = [{}];
        } else {
          extractedData[field] = {
            text: "",
            location: { pageNo: 0, ltwh: [0, 0, 0, 0] },
          };
        }
      }

      if (field !== "Table" && field !== "LedgerDetails" && field !== "ROI") {
        initialDisplayFields[field] =
          extractedData[field].text !== "" ||
          extractedData[field].location.pageNo !== 0 ||
          predefinedFields[field as keyof typeof predefinedFields] ||
          displayFields[field];
      }
    });

    setDisplayFields(initialDisplayFields);
  }, [extractedData]);

  useEffect(() => {
    if (!status) {
      return;
    }
    if (["in-review", "accepted", "done"].includes(status)) {
      setAllowReview(true);
    }
  }, [status]);

  const handleAddField = useCallback((fieldName: string) => {
    setDisplayFields((prevData) => ({
      ...prevData,
      [fieldName]: !prevData[fieldName],
    }));
  }, []);

  const handleSelectAll = useCallback(
    (selectAll: boolean) => {
      const newDisplayCols = Object.keys(displayFields).reduce(
        (acc, fieldName) => {
          acc[fieldName] = selectAll;
          return acc;
        },
        {} as DisplayFields
      );
      setDisplayFields(newDisplayCols);
    },
    [displayFields]
  );

  const renderField = useCallback(
    (fieldName: string, fieldValue: any) => {
      if (fieldName?.toLowerCase() === "filename" || !fieldValue) {
        return null;
      }
      if (
        fieldName !== "Table" &&
        viewType === "General" &&
        fieldName !== "LedgerDetails" &&
        fieldName !== "ROI" &&
        displayFields[fieldName]
      ) {
        return (
          <SingleValuedField
            allowReview={allowReview}
            key={fieldName}
            fieldName={fieldName}
            fieldValue={fieldValue}
            selectedField={selectedField}
            handleFieldClick={handleFieldClick}
            handleSingleValuedFieldChange={handleSingleValuedFieldChange}
            isEdit={isEdit}
          />
        );
      }
      if (fieldName === "Table" && viewType === "Items") {
        return (
          <div className="text-xs" key={fieldName}>
            <TableFields
              allowReview={allowReview}
              fieldName={fieldName}
              fieldValue={fieldValue}
              handleNestedFieldChange={handleNestedFieldChange}
              handleNestedRowDelete={handleNestedRowDelete}
              handleNestedRowAdd={handleNestedRowAdd}
              handleFieldClick={handleFieldClick}
              isEdit={isEdit}
            />
          </div>
        );
      }
      if (fieldName === "LedgerDetails" && viewType === "Ledgers") {
        return (
          <div className="text-xs" key={fieldName}>
            <TableFields
              allowReview={allowReview}
              fieldName={fieldName}
              fieldValue={fieldValue}
              handleNestedFieldChange={handleNestedFieldChange}
              handleNestedRowDelete={handleNestedRowDelete}
              handleNestedRowAdd={handleNestedRowAdd}
              handleFieldClick={handleFieldClick}
              isEdit={isEdit}
            />
          </div>
        );
      }
      if (fieldName === "ROI" && viewType === "ROI") {
        return (
          <div className="text-xs" key={fieldName}>
            <TableFields
              allowReview={allowReview}
              fieldName={fieldName}
              fieldValue={fieldValue}
              handleNestedFieldChange={handleNestedFieldChange}
              handleNestedRowDelete={handleNestedRowDelete}
              handleNestedRowAdd={handleNestedRowAdd}
              handleFieldClick={handleFieldClick}
              isEdit={isEdit}
            />
          </div>
        );
      }
      return null;
    },
    [displayFields, viewType, selectedField]
  );

  const downloadJSON = useCallback(
    (data: { [key: string]: any } | null, filename: string) => {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
    []
  );

  return (
    <div
      className={`bg-white bg-opacity-0 ${viewType === "General"
        ? "w-[30vw] overflow-y-auto custom-scrollbar"
        : "mt-2"
        } text-center font-mono`}
    >
      {triageLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
        </div>
      ) : (
        <div className="">
          <div
            className={`sticky top-0 bg-white shadow-md ${viewType === "General" ? "sm:mt-2 md:mt-3 lg:mt-4 xl:mt-4" : ""
              }`}
          >
            <div className="flex justify-between sm:text-xs md:text-xs lg:text-lg xl:text-lg ml-auto">
              {viewType === "General" && isEdit !== false && (
                <AddField
                  displayCols={displayFields}
                  handleAddField={handleAddField}
                  handleSelectAll={handleSelectAll}
                />
              )}
              <ToggleView
                viewType={viewType}
                handleChangeView={handleChangeView}
              />

              <div
                className="hover:bg-gray-200 rounded mr-2"
                title="Download JSON"
                onClick={() => downloadJSON(extractedData, `${doc_id}.json`)}
              >
                <svg
                  className="h-5 w-5 mt-2 text-black "
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" />
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                  <polyline points="7 11 12 16 17 11" />
                  <line x1="12" y1="4" x2="12" y2="16" />
                </svg>
              </div>
            </div>
          </div>
          <div className="shadow-md">
            {extractedData
              ? Object.keys(predefinedFields).map((fieldName) =>
                renderField(fieldName, extractedData[fieldName])
              )
              : !triageLoading && (
                <div className="flex flex-col items-center justify-center h-screen w-[30vw]">
                  <FaExclamationCircle className="text-5xl text-blue-400 mb-4" />
                  <p className="text-xl text-blue-600 mb-4">
                    No data available
                  </p>
                  <div className="space-x-4">
                    <button
                      onClick={() => startAnnotation()}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Annotate
                    </button>
                  </div>
                </div>
              )}
          </div>
          {isEdit !== false && (
            <div className="sticky bottom-0 z-50">
              <ActionButtons
                status={status}
                dataChanged={dataChanged}
                actionPending={actionPending}
                handleSave={handleSave}
                handleReset={handleReset}
                handleSubmit={handleSubmit}
                handleAccept={handleAccept}
                handleReject={handleReject}
                handleMoveToCompleted={handleMoveToCompleted}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExtractedFields;
