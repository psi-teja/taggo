import { useState, useEffect } from "react";
import DocViewer from "./DocViewer";
import SegregateInvoice from "./SegregateInvoice";
import axiosInstance from "@/app/utils/axiosInstance";

interface InteractiveSpaceProps {
  doc_id: string;
  is_superuser: boolean;
  segregation_status: string;
  invoice_type: string;
  invoice_subtype: string;
  handleNextClick: () => void;
}

const InteractiveSpace: React.FC<InteractiveSpaceProps> = ({
  doc_id,
  is_superuser,
  segregation_status,
  invoice_type,
  invoice_subtype,
  handleNextClick,
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

  const [dataChanged, setDataChanged] = useState(false);

  return (
    <div
      className={`overflow-hidden flex-1 h-full ${
        view === "General" ? "flex" : ""
      }`}
    >
      <DocViewer
        doc_id={doc_id}
        boxLocation={boxLocation}
        viewType={view}
        selectedField={selectedField}
        selectedRow={selectedRow}
        colName={colName}
        selectedNestedRow={selectedNestedRow}
        nestedColName={nestedColName}
        dataChanged={dataChanged}
      />

      <SegregateInvoice
        doc_id={doc_id}
        is_superuser={is_superuser}
        segregation_status={segregation_status}
        invoice_type={invoice_type}
        invoice_subtype={invoice_subtype}
        viewType={view}
        handleNextClick={handleNextClick}
      />
    </div>
  );
};

export default InteractiveSpace;
