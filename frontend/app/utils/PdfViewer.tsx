import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import PdfTools from "@/app/utils/PdfTools";
import axiosInstance from "@/app/utils/axiosInstance";
import "./styles.css"; // Assuming this file contains the .no-select class

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  file: string;
  boxLocation: Record<string, any> | null;
  viewType: string;
  downloadFile: (file: any, docType: string) => void;
  handleSingleValuedFieldChange?: (
    fieldName: string | null,
    value: string | null,
    location: Record<string, any> | null,
    instruction: string
  ) => void; // Add a new prop to update the boxLocation
  handleNestedFieldChange?: (
    fieldType: string,
    index: number | null,
    field: string | null,
    nestedIndex: number | null,
    nestedColName: string | null,
    value: string | null,
    location: Record<string, any> | null,
    instruction: string
  ) => void;
  selectedField: string | null;
  selectedRow: number | null;
  colName: string | null;
  selectedNestedRow: number | null;
  nestedColName: string | null;
  dataChanged: boolean;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  file,
  boxLocation,
  viewType,
  downloadFile,
  handleSingleValuedFieldChange,
  handleNestedFieldChange,
  selectedField,
  colName,
  selectedRow,
  selectedNestedRow,
  nestedColName,
}) => {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState(1);
  const [pdfDim, setPdfDim] = useState({ width: 0, height: 0 });
  const [drawingBox, setDrawingBox] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);
  const [endX, setEndX] = useState<number>(0);
  const [endY, setEndY] = useState<number>(0);
  const boundingBoxRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // State for loading spinner

  // const [showScrollbar, setShowScrollbar] = useState<boolean>(false);

  const viewerLoc = viewerRef.current?.getBoundingClientRect();

  // Fetch PDF dimensions on initial load or file change
  useEffect(() => {
    const fetchPdfDimensions = async () => {
      try {
        const pdfDoc = await pdfjs.getDocument(file).promise;
        const firstPage = await pdfDoc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        setPdfDim({ width: viewport.width, height: viewport.height });
        setNumPages(pdfDoc.numPages);
        setLoading(false); // Mark loading as complete
      } catch (error) {
        console.error("Error fetching PDF dimensions:", error);
        setLoading(false); // Mark loading as complete even if there's an error
      }
    };

    fetchPdfDimensions();
  }, [file]);

  // Adjust scale when PDF dimensions or viewer dimensions change
  useEffect(() => {
    if (pdfDim.width && viewerRef.current) {
      const viewerWidth = viewerRef.current.clientWidth;
      setScale(viewerWidth / pdfDim.width);
    }
  }, [pdfDim, viewerRef, viewType]);

  useEffect(() => {
    if (boundingBoxRef.current) {
      boundingBoxRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
    if (boxLocation) {
      setPageNumber(boxLocation.pageNo);
    }
  }, [boxLocation]);

  const renderAnnotations = () => {
    if (boxLocation === null) {
      if (startX == 0 && startY == 0) {
        return null;
      } else {
        return selectedField && newRectangle();
      }
    }

    const pageNo = boxLocation?.pageNo;

    if (
      !boxLocation ||
      !pdfDim.width ||
      !pdfDim.height ||
      pageNo !== pageNumber
    ) {
      return null;
    }

    const [left, top, width, height] = boxLocation.ltwh || [0, 0, 0, 0];

    const scaledLeft = left * scale * pdfDim.width;
    const scaledTop = top * scale * pdfDim.height;
    const scaledWidth = width * scale * pdfDim.width;
    const scaledHeight = height * scale * pdfDim.height;

    const boundingBoxStyle =
      "absolute bg-blue-300 bg-opacity-20 pointer-events-none";

    return (
      <div>
        <div
          ref={boundingBoxRef}
          className={boundingBoxStyle}
          style={{
            left: `${scaledLeft}px`,
            top: `${scaledTop}px`,
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            boxShadow: "0 0 10px rgba(255, 0, 0, 0.6)",
            borderRadius: "3px",
            border: "1px solid  #f00",
          }}
        />
      </div>
    );
  };

  const newRectangle = () => {
    const boundingBoxStyle =
      "absolute bg-blue-300 bg-opacity-20 pointer-events-none";

    // Get the reference to the page div
    const pageDiv = viewerRef.current;

    if (!pageDiv) return null;

    // Calculate the scroll offset of the page div
    const scrollOffsetX = pageDiv.scrollLeft;
    const scrollOffsetY = pageDiv.scrollTop;

    return (
      <div
        className={boundingBoxStyle}
        style={{
          left: `${Math.min(startX, endX) + scrollOffsetX}px`, // Adjust for horizontal scroll
          top: `${Math.min(startY, endY) + scrollOffsetY}px`, // Adjust for vertical scroll
          width: `${Math.abs(startX - endX)}px`,
          height: `${Math.abs(startY - endY)}px`,
          boxShadow: "0 0 10px rgba(255, 0, 0, 0.6)",
          borderRadius: "3px",
          border: "1px solid  #f00",
        }}
      />
    );
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const handleScaleChange = (e: { target: { value: string } }) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
  };

  const handlePageNumberChange = (e: { target: { value: string } }) => {
    const newPageNumber = Math.min(
      numPages ? numPages : 1,
      Math.max(1, parseInt(e.target.value, 10))
    );
    setPageNumber(newPageNumber);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDrawingBox(true);
    if (viewerLoc && !boxLocation) {
      document.body.classList.add("no-select");
      setStartX(e.clientX - viewerLoc.left);
      setStartY(e.clientY - viewerLoc.top);
      setEndX(e.clientX - viewerLoc.left);
      setEndY(e.clientY - viewerLoc.top);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boxLocation && viewerLoc && drawingBox) {
      setEndX(e.clientX - viewerLoc.left);
      setEndY(e.clientY - viewerLoc.top);
    }
  };

  const handleMouseUp = async () => {
    if (!boxLocation && selectedField) {
      setDrawingBox(false);
      document.body.classList.remove("no-select");

      if (viewerLoc) {
        const scrollOffsetX = viewerRef.current?.scrollLeft || 0;
        const scrollOffsetY = viewerRef.current?.scrollTop || 0;

        const left = Math.min(startX, endX) + scrollOffsetX;
        const top = Math.min(startY, endY) + scrollOffsetY;
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        const scaledLeft = left / pdfDim.width / scale;
        const scaledTop = top / pdfDim.height / scale;
        const scaledWidth = width / pdfDim.width / scale;
        const scaledHeight = height / pdfDim.height / scale;

        const bbox = {
          pageNo: pageNumber,
          ltwh: [scaledLeft, scaledTop, scaledWidth, scaledHeight],
        };

        if (["Table", "LedgerDetails", "ROI"].includes(selectedField)) {
          console.log(
            "PdfViewer - Add bbox\n\n",
            "\nselectedField",
            selectedField,
            "\nselectedRow",
            selectedRow,
            "\ncolName",
            colName,
            "\nselectedNestedRow",
            selectedNestedRow,
            "\nnestedColName",
            nestedColName
          );
          handleNestedFieldChange &&
            handleNestedFieldChange(
              selectedField,
              selectedRow,
              colName,
              selectedNestedRow,
              nestedColName,
              null,
              bbox,
              "add bbox"
            );
        } else {
          handleSingleValuedFieldChange &&
            handleSingleValuedFieldChange(
              selectedField,
              null,
              bbox,
              "add bbox"
            );
        }

        // Ensure correct canvas selection
        const canvasElement = viewerRef.current?.querySelector("canvas");
        if (!canvasElement) {
          console.error("Canvas not found");
          return;
        }

        // Get the bounding rect of the canvas
        const canvasRect = canvasElement.getBoundingClientRect();
        const scaleX = canvasElement.width / canvasRect.width;
        const scaleY = canvasElement.height / canvasRect.height;

        // Adjust mouse coordinates relative to the canvas
        const adjustedLeft = left * scaleX;
        const adjustedTop = top * scaleY;
        const adjustedWidth = width * scaleX;
        const adjustedHeight = height * scaleY;

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = adjustedWidth;
        canvas.height = adjustedHeight;

        context?.drawImage(
          canvasElement,
          adjustedLeft,
          adjustedTop,
          adjustedWidth,
          adjustedHeight,
          0,
          0,
          adjustedWidth,
          adjustedHeight
        );

        canvas.toBlob(async (blob) => {
          if (!blob) return;

          const formData = new FormData();
          formData.append("file", blob, "cropped_image.png");

          try {
            const { data } = await axiosInstance.post(
              "/get_ocr_text/",
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              }
            );

            if (["Table", "LedgerDetails", "ROI"].includes(selectedField)) {
              console.log(
                "PdfViewer - Update value\n\n",
                "\nselectedField",
                selectedField,
                "\nselectedRow",
                selectedRow,
                "\ncolName",
                colName,
                "\nselectedNestedRow",
                selectedNestedRow,
                "\nnestedColName",
                nestedColName
              );
              handleNestedFieldChange &&
                handleNestedFieldChange(
                  selectedField,
                  selectedRow,
                  colName,
                  selectedNestedRow,
                  nestedColName,
                  data.text,
                  bbox,
                  "update value"
                );
            } else {
              handleSingleValuedFieldChange &&
                handleSingleValuedFieldChange(
                  selectedField,
                  data.text,
                  null,
                  "update value"
                );
            }
          } catch (error) {
            console.error("Error during OCR:", error);
          }
        });
      }

      setStartX(0);
      setStartY(0);
    }
  };

  return (
    <div className="relative">
        <PdfTools
          docType={"pdf"}
          scale={scale}
          handlePageNumberChange={handlePageNumberChange}
          pageNumber={pageNumber}
          numPages={numPages}
          downloadFile={downloadFile}
          file={file}
          handleScaleChange={handleScaleChange}
        />

      <div
        className={`${!boxLocation && selectedField ? "cursor-crosshair" : ""
          }`}
        ref={viewerRef}
      >
        {loading && (
          <div className="relative inset-0 flex items-center justify-center bg-white bg-opacity-75 h-screen">
            <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
          </div>
        )}
        <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
          <Page
            pageNumber={pageNumber}
            scale={scale}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {renderAnnotations()}
          </Page>
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
