import React, { useState, useEffect, useRef } from "react";
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
}

interface SelectedElement {
    section: string;
    id: string;
    target: string;
    boxLocation: {
        "BoundingBox": {
            "left": number;
            "top": number;
            "width": number;
            "height": number;
        },
        "Page": number;
    }
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  taskDetails,
  selectedElement,
  isEditor,
  leftWidth
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
        handleScaleChange={(e)=> setScale(parseFloat(e.target.value))}
      />

      <div className="w-full overflow-auto no-select h-[calc(100vh-100px)]"
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
          >
          </Page>
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
