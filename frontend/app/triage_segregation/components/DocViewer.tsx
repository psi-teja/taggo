import React, { useEffect, useState } from "react";
import FileSaver from "file-saver";
import PdfViewer from "@/app/utils/PdfViewer";

interface DocViewerProps {
  doc_id: string | null;
  boxLocation: Record<string, any> | null; // Define the type for boxLocation
  viewType: string; // Define the type for viewType
  selectedField: string | null;
  selectedRow: number | null;
  colName: string | null;
  selectedNestedRow: number | null;
  nestedColName: string | null;
  dataChanged: boolean;
}

const DocViewer: React.FC<DocViewerProps> = ({
  doc_id,
  boxLocation,
  viewType,
  selectedField,
  selectedRow,
  colName,
  selectedNestedRow,
  nestedColName,
  dataChanged,
}) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fileUrl = `${API_BASE_URL}/get_document_seg/${doc_id}`;

  const downloadFile = (file: string, docType: string) => {
    fetch(file)
      .then((response) => response.blob())
      .then((blob) => {
        FileSaver.saveAs(blob, `${doc_id}.${docType}`);
      })
      .catch((error) => {
        console.error("Error downloading file:", error);
      });
  };

  return (
    <div
      className={`overflow-y-auto custom-scrollbar ${
        viewType === "General" ? "w-[70vw]" : "h-[50vh]"
      } border border-gray-400 shadow-md`}
    >
      <PdfViewer
        file={fileUrl}
        boxLocation={boxLocation}
        viewType={viewType}
        downloadFile={downloadFile}
        selectedField={selectedField}
        colName={colName}
        dataChanged={dataChanged}
        selectedRow={selectedRow}
        selectedNestedRow={selectedNestedRow}
        nestedColName={nestedColName}
      />
    </div>
  );
};

export default DocViewer;
