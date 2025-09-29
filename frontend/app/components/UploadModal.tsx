import { useState, ChangeEvent, useEffect } from "react";
import { createPortal } from "react-dom";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: FileList) => void;
  handleOk: () => void;
  uploadProgress: number;
  failedFiles: { name: string; message: string }[];
  uploadDone: boolean;
}

const FileList = ({
  files,
  onDelete,
}: {
  files: FileList;
  onDelete: (index: number) => void;
}) => (
  <div className="mb-4 overflow-y-auto max-h-40 hover:bg-gray-100 overflow-hidden hover:overflow-y-auto custom-scrollbar">
    {Array.from(files).map((file, index) => (
      <li
        key={index}
        className="flex justify-between items-center hover:bg-gray-200 p-2 rounded-lg"
      >
        <span>{file.name}</span>
        <button
          onClick={() => onDelete(index)}
          className="text-red-500 hover:bg-red-300 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          aria-label={`Delete ${file.name}`}
        >
          <svg
            className="h-6 w-6 text-red-500"
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </li>
    ))}
  </div>
);

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="mb-4">
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
);

const UploadModal = ({
  isOpen,
  onClose,
  onUpload,
  handleOk,
  uploadProgress,
  failedFiles,
  uploadDone,
}: UploadModalProps) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scroll when modal open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(event.target.files);
    }
  };

  const handleClose = () => {
    setSelectedFiles(null);
    setSubmitted(false);
    onClose();
  };

  const handleDeleteFile = (index: number) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      newFiles.splice(index, 1);
      const dataTransfer = new DataTransfer();
      newFiles.forEach((file) => dataTransfer.items.add(file));
      setSelectedFiles(dataTransfer.files);
    }
  };

  const handleSubmit = () => {
    if (selectedFiles) {
      setSubmitted(true);
      onUpload(selectedFiles);
    } else {
      alert("Please select files.");
    }
  };

  if (!isOpen || !mounted) return null;

  const overlayBase =
    "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm";
  const panelBase =
    "relative w-full max-w-lg rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl";
  const headingBase = "text-xl font-semibold mb-4 text-teal-700 dark:text-teal-300";
  const btnBase =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition";

  const successView = (
    <div className={overlayBase} role="dialog" aria-modal="true">
      <div className={panelBase}>
        <div className="p-6">
          {failedFiles.length > 0 ? (
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-3 text-red-600 dark:text-red-400">
                {failedFiles.length} File{failedFiles.length > 1 && "s"} Failed
              </h3>
              <ul className="list-disc list-inside space-y-1 max-h-40 overflow-hidden hover:overflow-y-auto custom-scrollbar pr-1">
                {failedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex flex-col gap-0.5 rounded-md px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-sm"
                  >
                    <span className="font-medium leading-tight">{file.name}</span>
                    <span className="text-xs opacity-80 leading-tight">{file.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center m-4 text-emerald-600 dark:text-emerald-400">
              <div className="h-16 w-16 mb-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-inner">
                <svg
                  className="h-10 w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3.5"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <span className="text-lg font-semibold">Upload Successful</span>
            </div>
          )}
          <div className="flex justify-center mt-2">
            <button
              onClick={handleOk}
              className={`${btnBase} bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow hover:shadow-md focus:ring-teal-400 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800`}
            >
              OK
            </button>
          </div>
        </div>
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 shadow-sm"
        >
          <span className="sr-only">Close</span>
          ✕
        </button>
      </div>
    </div>
  );

  const normalView = (
    <div className={overlayBase} role="dialog" aria-modal="true">
      <div className={`${panelBase} p-5`}>
        <div className="flex items-start justify-between mb-2">
          <h2 className={headingBase}>Upload Files</h2>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 shadow-sm"
          >
            ✕
          </button>
        </div>
        <input
          type="file"
          multiple
          accept=".pdf, .jpeg, .png, .jpg"
          onChange={handleFileChange}
          className="block w-full text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-700/60 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-600/30 dark:file:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 mb-4"
          aria-label="Upload Files"
        />
        {selectedFiles && !submitted && (
          <FileList files={selectedFiles} onDelete={handleDeleteFile} />
        )}
        {submitted && <ProgressBar progress={uploadProgress} />}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleClose}
            className={`${btnBase} bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 focus:ring-slate-400 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`${btnBase} bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow hover:shadow-md focus:ring-teal-400 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800`}
            disabled={submitted}
          >
            {submitted ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(uploadDone ? successView : normalView, document.body);
};

export default UploadModal;
