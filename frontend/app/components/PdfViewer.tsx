import React, { useState, useEffect, useRef, use } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { downloadFile } from "../hooks/downloadFile";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import PdfTools from "@/app/components/PdfTools";
import "./styles.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  taskDetails: any;
  selectedElement: SelectedElement | null;
  isEditor: boolean;
  leftWidth: number; // Added leftWidth prop
  handleFieldChange: (element: SelectedElement) => void;
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
    }|null,
    "Page": number;
  }
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  taskDetails,
  selectedElement,
  isEditor,
  leftWidth,
  handleFieldChange
}) => {

  if (!taskDetails) {
    return (
      <div className="relative inset-0 flex items-center justify-center bg-white bg-opacity-75 h-screen w-[70vw]">
        <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
      </div>
    );
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  let fileUrl = `${API_BASE_URL}/media/invoice-annotation/documents/${taskDetails.filename}`;
  const isPdf = taskDetails.filename?.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    fileUrl = `${API_BASE_URL}/convert_to_pdf/invoice-annotation/${taskDetails.filename}/`;
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

  useEffect(() => {
    if (pdfDim.width && viewerRef.current) {
      const viewerWidth = viewerRef.current.clientWidth;
      const newCalculatedScale = viewerWidth / pdfDim.width
      setScale(newCalculatedScale);
    }
  }, [pdfDim, viewerRef, leftWidth]);


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
    const updatedElement = selectedElement;
    
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

      handleFieldChange(updatedElement);
    }
  };

  return (
    <div className="relative">
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

      <div className={`w-full overflow-auto no-select h-[calc(100vh-100px)] ${selectedElement && !selectedElement.boxLocation.BBox ? "cursor-crosshair" : ""}`}
        ref={viewerRef}>
        {loading && (
          <div className="relative inset-0 flex items-center justify-center bg-white bg-opacity-75 h-screen">
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
          </Page>
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
