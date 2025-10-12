import React, { useState, useEffect, useRef, use } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { downloadFile } from "../hooks/downloadFile";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import PdfTools from "@/app/components/PdfTools";
import axiosInstance from "@/app/hooks/axiosInstance";
import "./styles.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  taskDetails: any;
  selectedElement: SelectedElement | null;
  isEditor: boolean;
  leftWidth: number; // Added leftWidth prop
  handleFieldChange: (element: SelectedElement) => void;
  overlays?: Array<{
    id: string;
    BBox: { left: number; top: number; width: number; height: number } | null;
    Page: number;
    label?: string;
    color?: string;
  }>;
}

interface SelectedElement {
  section: string;
  id: string;
  target: string;
  text: string | null;
  boxLocation: {
    "BBox": {
      "left": number;
      "top": number;
      "width": number;
      "height": number;
    } | null,
    "Page": number;
  }
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  taskDetails,
  selectedElement,
  isEditor,
  leftWidth,
  handleFieldChange,
  overlays
}) => {

  if (!taskDetails) {
    return (
      <div className="relative inset-0 flex items-center justify-center bg-white bg-opacity-75 h-screen w-[70vw]">
        <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
      </div>
    );
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const taskType = taskDetails?.task_type || 'invoice-annotation';
  let fileUrl = `${API_BASE_URL}/media/${taskType}/documents/${taskDetails.filename}`;
  const isPdf = taskDetails.filename?.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    fileUrl = `${API_BASE_URL}/convert_to_pdf/${taskType}/${taskDetails.filename}/`;
  }

  const [loading, setLoading] = useState<boolean>(true); // State for loading spinner

  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  const [scale, setScale] = useState(1);
  const [pdfDim, setPdfDim] = useState({ width: 0, height: 0 });

  const boundingBoxRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const viewerLoc = viewerRef.current?.getBoundingClientRect();

  const [startX, setStartX] = useState<number | null>(null)
  const [endX, setEndX] = useState<number | null>(null)
  const [startY, setStartY] = useState<number | null>(null)
  const [endY, setEndY] = useState<number | null>(null)

  const [drawingBox, setDrawingBox] = useState<boolean>(false)

  const scrollSpeed = 10; // pixels per interval
  const scrollMargin = 50; // pixels from edge to start scrolling

  useEffect(() => {
    const fetchPdfDimensions = async () => {
      try {
        const pdfDoc = await pdfjs.getDocument(fileUrl).promise;
        const firstPage = await pdfDoc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        setPdfDim({ width: viewport.width, height: viewport.height });
        setNumPages(pdfDoc.numPages);
        setLoading(false); // Mark loading as complete
      } catch (error) {
        console.error("Error fetching PDF dimensions:", error);
        setLoading(false);
      }
    };

    fetchPdfDimensions();
  }, [fileUrl]);

  const recalcScaleFromContainer = () => {
    if (pdfDim.width && viewerRef.current) {
      const viewerWidth = viewerRef.current.clientWidth;
      const newCalculatedScale = viewerWidth / pdfDim.width;
      setScale(newCalculatedScale);
    }
  };

  useEffect(() => {
    recalcScaleFromContainer();
    const handleResize = () => recalcScaleFromContainer();
    window.addEventListener('resize', handleResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && viewerRef.current) {
      ro = new ResizeObserver(() => recalcScaleFromContainer());
      ro.observe(viewerRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro && viewerRef.current) ro.disconnect();
    };
  }, [pdfDim.width, viewerRef]);


  useEffect(() => {
    if (selectedElement && selectedElement.boxLocation && selectedElement.boxLocation.Page) {
      setPageNumber(selectedElement.boxLocation.Page);
    }
  }, [selectedElement]);

  const renderBoundingBox = () => {

    let scaledLeft = 0;
    let scaledTop = 0;
    let scaledWidth = 0;
    let scaledHeight = 0;

    if (selectedElement) {
      if (selectedElement.boxLocation.BBox) {
        const { left, top, width, height } = selectedElement.boxLocation.BBox;
        scaledLeft = left * scale * pdfDim.width;
        scaledTop = top * scale * pdfDim.height;
        scaledWidth = width * scale * pdfDim.width;
        scaledHeight = height * scale * pdfDim.height;
      }
      else {
        if (startX && startY && endX && endY && drawingBox) {
          scaledLeft = Math.min(startX, endX);
          scaledTop = Math.min(startY, endY);
          scaledWidth = Math.abs(startX - endX);
          scaledHeight = Math.abs(startY - endY);
        }
        else {
          return null;
        }
      }
    }
    else {
      return null;
    }

    const boundingBoxStyle = {
      position: "absolute" as const,
      left: `${scaledLeft}px`,
      top: `${scaledTop}px`,
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      border: "2px solid red",
      pointerEvents: "none" as const,
    };

    return (
      <div
        ref={boundingBoxRef}
        style={boundingBoxStyle}
        className="absolute"
      />
    );

  }

  const renderOverlays = () => {
    if (!overlays || !Array.isArray(overlays)) return null;
    return overlays
      .filter(o => !!o.BBox && o.Page === pageNumber)
      .map(o => {
        const { left, top, width, height } = o.BBox as any;
        const scaledLeft = left * scale * pdfDim.width;
        const scaledTop = top * scale * pdfDim.height;
        const scaledWidth = width * scale * pdfDim.width;
        const scaledHeight = height * scale * pdfDim.height;
        const style = {
          position: 'absolute' as const,
          left: `${scaledLeft}px`,
          top: `${scaledTop}px`,
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          border: `2px solid ${o.color || 'rgba(59,130,246,0.9)'}`,
          pointerEvents: 'none' as const,
        };
        return (
          <div key={o.id} style={style} className="absolute">
            {o.label && (
              <span className="absolute -top-5 left-0 text-xs px-1 py-0.5 rounded bg-blue-600 text-white" style={{ pointerEvents: 'none' }}>{o.label}</span>
            )}
          </div>
        );
      });
  };

  useEffect(() => {
    if (selectedElement && boundingBoxRef.current && viewerRef.current) {
      setTimeout(() => {
        boundingBoxRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }, 100);
    }
  }, [selectedElement]);


  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {

    if (selectedElement && !selectedElement.boxLocation.BBox && viewerRef.current) {
      setDrawingBox(true);
      const rect = viewerRef.current.getBoundingClientRect();
      const scrollOffsetX = viewerRef.current?.scrollLeft || 0;
      const scrollOffsetY = viewerRef.current?.scrollTop || 0;

      const offSetX = e.clientX - rect?.left + scrollOffsetX;
      const offSetY = e.clientY - rect?.top + scrollOffsetY;

      setStartX(offSetX);
      setStartY(offSetY);

      setEndX(offSetX);
      setEndY(offSetY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drawingBox && viewerRef.current) {
      const rect = viewerRef.current.getBoundingClientRect();

      setEndX(e.clientX - rect?.left + viewerRef.current.scrollLeft);
      setEndY(e.clientY - rect?.top + viewerRef.current.scrollTop);

      handleAutoScroll(e);
    }
  };

  const handleAutoScroll = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    let scrolled = false;

    const { clientX, clientY } = e;
    const { top, bottom, left, right } = viewer.getBoundingClientRect();

    if (bottom - clientY < scrollMargin) {
      viewer.scrollTop += scrollSpeed;
      scrolled = true;
    }

    if (clientY - top < scrollMargin) {
      viewer.scrollTop -= scrollSpeed;
      scrolled = true;
    }

    if (right - clientX < scrollMargin) {
      viewer.scrollLeft += scrollSpeed;
      scrolled = true;
    }

    if (clientX - left < scrollMargin) {
      viewer.scrollLeft -= scrollSpeed;
      scrolled = true;
    }

    if (scrolled) {
      const newEndX = clientX - left + viewer.scrollLeft;
      const newEndY = clientY - top + viewer.scrollTop;

      setEndX(newEndX);
      setEndY(newEndY);
    }

  };

  const handleMouseUp = async () => {
    setDrawingBox(false)
    // Create a deep copy of selectedElement
    const updatedElement = selectedElement ? {
      ...selectedElement,
      boxLocation: {
        ...selectedElement.boxLocation,
        BBox: selectedElement.boxLocation.BBox ? { ...selectedElement.boxLocation.BBox } : null
      }
    } : null;

    if (updatedElement && startX && startY && endX && endY) {
      const left = Math.min(startX, endX);
      const top = Math.min(startY, endY);
      const width = Math.abs(startX - endX);
      const height = Math.abs(startY - endY);

      updatedElement.boxLocation.BBox = {
        left: left / (scale * pdfDim.width),
        top: top / (scale * pdfDim.height),
        width: width / (scale * pdfDim.width),
        height: height / (scale * pdfDim.height),
      };
      updatedElement.boxLocation.Page = pageNumber;

      if (!["invoice-annotation"].includes(taskDetails.task_type)) {
        handleFieldChange(updatedElement);
        return;
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
          console.log("OCR Result:", data.text);
          updatedElement.text = data.text || null;
          handleFieldChange(updatedElement);
        } catch (error) {
          console.error("Error during OCR:", error);
        }
      });
    }
  };

  const [isModifierKeyPressed, setIsModifierKeyPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        setIsModifierKeyPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) {
        setIsModifierKeyPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (isModifierKeyPressed) {
      e.preventDefault();
      const delta = e.deltaY;
      setScale(prevScale => {
        const newScale = delta < 0 ? prevScale * 1.1 : prevScale * 0.9;
        return Math.min(Math.max(newScale, 0.1), 10.0);
      });
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full">
      <PdfTools
        filename={taskDetails.filename}
        scale={scale}
        handlePageNumberChange={(e) => setPageNumber(Math.min(numPages ? numPages : 1, Math.max(1, parseInt(e.target.value, 10))))}
        pageNumber={pageNumber}
        numPages={numPages}
        downloadFile={() => downloadFile(fileUrl, taskDetails.filename)}
        fileUrl={fileUrl}
        handleScaleChange={(e) => setScale(parseFloat(e.target.value))}
      />

      <div
        className={`w-full overflow-auto no-select flex-1 min-h-0 ${selectedElement && !selectedElement.boxLocation.BBox ? "cursor-crosshair" : ""}`}
        ref={viewerRef}
        onWheel={handleWheel}
      >
        {loading && (
          <div className="relative inset-0 flex items-center justify-center bg-white bg-opacity-75 h-full">
            <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
          </div>
        )}
        <Document file={fileUrl} onLoadSuccess={(pdf: any) => setNumPages(pdf.numPages)}>
          <Page
            pageNumber={pageNumber}
            scale={scale}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {renderBoundingBox()}
            {renderOverlays()}
          </Page>
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
