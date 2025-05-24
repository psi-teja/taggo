import React, { ChangeEvent } from "react";
import { downloadFile } from "../hooks/downloadFile";

interface PdfToolsProps {
  scale: number;
  handlePageNumberChange: (event: ChangeEvent<HTMLInputElement>) => void;
  pageNumber: number;
  numPages: number | undefined;
  downloadFile: (file: any, docType: string) => void;
  fileUrl: string;
  handleScaleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  filename: string;
}

const PdfTools: React.FC<PdfToolsProps> = ({
  scale,
  handlePageNumberChange,
  pageNumber,
  numPages,
  downloadFile,
  fileUrl,
  handleScaleChange,
  filename,
}) => {
  return (
    <div className="p-1 flex justify-between items-center text-xs bg-slate-400 sticky top-0 left-0 z-10 shadow"> 
      <input
        className="sm:w-20 md:w-30 lg:w-40 xl:w-50"
        id="scaleSlider"
        type="range"
        min="0.1"
        max="10"
        step="0.1"
        value={scale}
        onChange={handleScaleChange}
      />
      <div className="flex items-center">
        <input
          type="number"
          value={pageNumber}
          onChange={handlePageNumberChange}
          className="w-10 text-center border-1 mr-1 rounded focus:outline-none focus:border-blue-500"
        />
         / {numPages}
      </div>
      <div
        className="hover:bg-gray-200 rounded"
        title="Download File" 
        onClick={() => downloadFile(fileUrl, filename)}
      >
        <svg
          className="h-5 w-5 text-black "
          width="26"
          height="26"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {" "}
          <path stroke="none" d="M0 0h24v24H0z" />{" "}
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />{" "}
          <polyline points="7 11 12 16 17 11" />{" "}
          <line x1="12" y1="4" x2="12" y2="16" />
        </svg>
      </div>
    </div>
  );
};

export default PdfTools;
