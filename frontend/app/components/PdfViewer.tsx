"use client";
import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { downloadFile } from "../hooks/downloadFile";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import PdfTools from "@/app/components/PdfTools";
import axiosInstance from "@/app/hooks/axiosInstance";
import "./styles.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface SelectedElement {
  section: string;
  id: string;
  target: string;
  text: string | null;
  boxLocation: {
    BBox: {
      left: number;
      top: number;
      width: number;
      height: number;
    } | null;
    Page: number;
  };
}

interface PdfViewerProps {
  taskDetails: any;
  selectedElement: SelectedElement | null;
  isEditor: boolean;
  leftWidth: number;
  handleFieldChange: (element: SelectedElement) => void;
  overlays?: Array<{
    id: string;
    BBox: { left: number; top: number; width: number; height: number } | null;
    Page: number;
    label?: string;
    color?: string;
  }>;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  taskDetails,
  selectedElement,
  isEditor,
  leftWidth,
  handleFieldChange,
  overlays
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState(1);
  const [pdfDim, setPdfDim] = useState({ width: 0, height: 0 });

  const boundingBoxRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [endX, setEndX] = useState<number | null>(null);
  const [endY, setEndY] = useState<number | null>(null);
  const [drawingBox, setDrawingBox] = useState<boolean>(false);

  const scrollSpeed = 10;
  const scrollMargin = 50;

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  let fileUrl = `${API_BASE_URL}/media/documents/${taskDetails?.filename}`;
  if (taskDetails?.filename && !taskDetails.filename.toLowerCase().endsWith(".pdf")) {
    fileUrl = `${API_BASE_URL}/convert_to_pdf/${taskDetails.filename}/`;
  }

  useEffect(() => {
    if (!taskDetails?.filename) return;
    const fetchPdfDimensions = async () => {
      try {
        const pdfDoc = await pdfjs.getDocument(fileUrl).promise;
        const firstPage = await pdfDoc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        setPdfDim({ width: viewport.width, height: viewport.height });
        setNumPages(pdfDoc.numPages);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching PDF dimensions:", error);
        setLoading(false);
      }
    };
    fetchPdfDimensions();
  }, [fileUrl, taskDetails]);

  const recalcScaleFromContainer = () => {
    if (pdfDim.width && viewerRef.current) {
      const viewerWidth = viewerRef.current.clientWidth;
      setScale(viewerWidth / pdfDim.width);
    }
  };

  useEffect(() => {
    recalcScaleFromContainer();
    window.addEventListener('resize', recalcScaleFromContainer);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && viewerRef.current) {
      ro = new ResizeObserver(() => recalcScaleFromContainer());
      ro.observe(viewerRef.current);
    }
    return () => {
      window.removeEventListener('resize', recalcScaleFromContainer);
      if (ro) ro.disconnect();
    };
  }, [pdfDim.width]);

  useEffect(() => {
    // Only change the page if the selected element actually has a coordinate
    if (selectedElement?.boxLocation?.BBox && selectedElement?.boxLocation?.Page) {
      setPageNumber(selectedElement.boxLocation.Page);
    }
  }, [selectedElement]);

 useEffect(() => {
  // Only attempt to scroll if we have a valid bounding box to scroll to
  if (selectedElement?.boxLocation?.BBox && boundingBoxRef.current) {
    const timer = setTimeout(() => {
      boundingBoxRef.current?.scrollIntoView({ 
        behavior: "smooth", 
        block: "center" 
      });
    }, 100);
    return () => clearTimeout(timer);
  }
}, [selectedElement]);

  const renderBoundingBox = () => {
    let scaledLeft = 0, scaledTop = 0, scaledWidth = 0, scaledHeight = 0;

    if (selectedElement?.boxLocation.BBox) {
      const { left, top, width, height } = selectedElement.boxLocation.BBox;
      scaledLeft = left * scale * pdfDim.width;
      scaledTop = top * scale * pdfDim.height;
      scaledWidth = width * scale * pdfDim.width;
      scaledHeight = height * scale * pdfDim.height;
    } else if (drawingBox && startX !== null && startY !== null && endX !== null && endY !== null) {
      scaledLeft = Math.min(startX, endX);
      scaledTop = Math.min(startY, endY);
      scaledWidth = Math.abs(startX - endX);
      scaledHeight = Math.abs(startY - endY);
    } else {
      return null;
    }

    return (
      <div
        ref={boundingBoxRef}
        className="absolute z-10"
        style={{
          left: `${scaledLeft}px`,
          top: `${scaledTop}px`,
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          border: "2px solid red",
          pointerEvents: "none"
        }}
      />
    );
  };

  const renderOverlays = () => {
    if (!overlays) return null;
    return overlays
      .filter(o => o.BBox && o.Page === pageNumber)
      .map(o => {
        const { left, top, width, height } = o.BBox!;
        return (
          <div
            key={o.id}
            className="absolute z-0"
            style={{
              left: `${left * scale * pdfDim.width}px`,
              top: `${top * scale * pdfDim.height}px`,
              width: `${width * scale * pdfDim.width}px`,
              height: `${height * scale * pdfDim.height}px`,
              border: `2px solid ${o.color || 'rgba(59,130,246,0.9)'}`,
              pointerEvents: 'none',
            }}
          >
            {o.label && (
              <span className="absolute -top-5 left-0 text-[10px] px-1 bg-blue-600 text-white rounded">
                {o.label}
              </span>
            )}
          </div>
        );
      });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedElement && !selectedElement.boxLocation.BBox && viewerRef.current) {
      setDrawingBox(true);
      const rect = viewerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + viewerRef.current.scrollLeft;
      const y = e.clientY - rect.top + viewerRef.current.scrollTop;
      setStartX(x); setStartY(y); setEndX(x); setEndY(y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (drawingBox && viewerRef.current) {
      const rect = viewerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + viewerRef.current.scrollLeft;
      const y = e.clientY - rect.top + viewerRef.current.scrollTop;
      setEndX(x); setEndY(y);
      handleAutoScroll(e);
    }
  };

  const handleAutoScroll = (e: React.MouseEvent) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const { clientX, clientY } = e;
    const { top, bottom, left, right } = viewer.getBoundingClientRect();
    if (bottom - clientY < scrollMargin) viewer.scrollTop += scrollSpeed;
    else if (clientY - top < scrollMargin) viewer.scrollTop -= scrollSpeed;
    if (right - clientX < scrollMargin) viewer.scrollLeft += scrollSpeed;
    else if (clientX - left < scrollMargin) viewer.scrollLeft -= scrollSpeed;
  };

  const handleMouseUp = async () => {
    if (!drawingBox || !selectedElement) return;
    setDrawingBox(false);

    if (startX !== null && startY !== null && endX !== null && endY !== null) {
      const left = Math.min(startX, endX);
      const top = Math.min(startY, endY);
      const width = Math.abs(startX - endX);
      const height = Math.abs(startY - endY);

      // Create update with normalized coordinates
      const updatedElement = {
        ...selectedElement,
        boxLocation: {
          BBox: {
            left: left / (scale * pdfDim.width),
            top: top / (scale * pdfDim.height),
            width: width / (scale * pdfDim.width),
            height: height / (scale * pdfDim.height),
          },
          Page: pageNumber
        }
      };

      const canvasElement = viewerRef.current?.querySelector("canvas");
      if (canvasElement && width > 5 && height > 5) {
        const canvasRect = canvasElement.getBoundingClientRect();
        const sX = canvasElement.width / canvasRect.width;
        const sY = canvasElement.height / canvasRect.height;

        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = width * sX;
        cropCanvas.height = height * sY;
        const ctx = cropCanvas.getContext("2d");
        ctx?.drawImage(canvasElement, left * sX, top * sY, width * sX, height * sY, 0, 0, width * sX, height * sY);

        cropCanvas.toBlob(async (blob) => {
          if (!blob) return;
          const formData = new FormData();
          formData.append("file", blob, "crop.png");

          try {
            // Do NOT pass headers here, let the browser handle it
            const { data } = await axiosInstance.post("/get_ocr_text/", formData);
            // Use the logic from the previous update to handle Label vs Value target
            handleFieldChange({
              ...selectedElement,
              text: data.text || "",
              boxLocation: {
                BBox: {
                  left: left / (scale * pdfDim.width),
                  top: top / (scale * pdfDim.height),
                  width: width / (scale * pdfDim.width),
                  height: height / (scale * pdfDim.height),
                },
                Page: pageNumber
              }
            });
            console.log(pageNumber)
          } catch (error) {
            console.error("OCR API error", error);
          }
        }, "image/png");
      } else {
        handleFieldChange(updatedElement);
      }
    }
  };

  // If taskDetails hasn't loaded yet, show a placeholder
  if (!taskDetails) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="animate-pulse text-slate-400">Loading document details...</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-100">
      <PdfTools
        filename={taskDetails.filename}
        scale={scale}
        pageNumber={pageNumber}
        numPages={numPages}
        handlePageNumberChange={(e) => {
          const value = Number(e.target.value);
          if (numPages) {
            setPageNumber(Math.max(1, Math.min(value, numPages)));
          } else {
            setPageNumber(1);
          }
        }}
        handleScaleChange={(e) => setScale(parseFloat(e.target.value))}
        downloadFile={() => downloadFile(fileUrl, taskDetails.filename)}
        fileUrl={fileUrl}
      />

      <div
        ref={viewerRef}
        className={`flex-1 overflow-auto flex justify-center ${selectedElement && !selectedElement.boxLocation.BBox ? "cursor-crosshair" : ""}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="relative shadow-2xl bg-white h-fit">
          <Document file={fileUrl} loading={<div className="p-20 animate-pulse">Loading PDF...</div>}>
            <Page
              pageNumber={pageNumber}
              scale={scale}
              onMouseDown={handleMouseDown}
              renderAnnotationLayer={true}
              renderTextLayer={true}
            >
              {renderBoundingBox()}
              {renderOverlays()}
            </Page>
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;