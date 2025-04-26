import { useState, ChangeEvent, useEffect } from "react";
import axiosInstance from "./axiosInstance";
import CreateBatch from "./CreateBatch";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: FileList, batch?: Batch) => void;
  handleOk: () => void;
  uploadProgress: number;
  failedFiles: { name: string; message: string }[];
  uploadDone: boolean;
  showBatch?: boolean;
}

interface Batch {
  id: number;
  name: string;
  description: string;
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
  showBatch = true,
}: UploadModalProps) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [createBatchOpen, setCreateBatchOpen] = useState<boolean>(false);

  const fetchBatches = async () => {
    setCreateBatchOpen(false);
    try {
      const response = await axiosInstance.get("/get_batches");
      const data = response.data;
      setBatches(data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(event.target.files);
    }
  };

  const handleBatchChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedBatch =
      batches.find((batch) => batch.name === event.target.value) || null;
    setSelectedBatch(selectedBatch);
  };

  const handleClose = () => {
    setSelectedFiles(null);
    setSelectedBatch(null);
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
    if (showBatch) {
      if (selectedFiles && selectedBatch) {
        setSubmitted(true);
        onUpload(selectedFiles, selectedBatch);
      } else {
        alert("Please select files and enter a batch name.");
      }
    } else {
      if (selectedFiles) {
        setSubmitted(true);
        onUpload(selectedFiles);
      } else {
        alert("Please select files.");
      }
    }
  };

  if (!isOpen) return null;

  if (uploadDone) {
    return (
      <div
        className="fixed inset-0 bg-blue-200 bg-opacity-50 flex justify-center items-center z-50"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-1/3">
          {failedFiles.length > 0 ? (
            <div className="mb-4 text-red-500">
              <h3 className="font-bold text-lg mb-2">
                {failedFiles.length} Files Failed
              </h3>
              <ul className="list-disc list-inside space-y-1 max-h-40 hover:bg-gray-100 overflow-hidden hover:overflow-y-auto custom-scrollbar">
                {failedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center hover:bg-gray-200 p-2 rounded-lg"
                  >
                    <span>{file.name}</span>
                    <span className="text-sm">{file.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center m-8 text-green-600">
              <svg
                className="h-12 w-12 m-4 text-white rounded-full bg-green-600 p-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              <span className="text-lg font-semibold">Upload Successful!</span>
            </div>
          )}
          <div className="flex justify-center m-2">
            <button
              onClick={handleOk}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-blue-200 bg-opacity-50 flex justify-center items-center z-50"
      role="dialog"
      aria-modal="true"
    >
      {createBatchOpen ? (
        <CreateBatch handleClose={fetchBatches}></CreateBatch>
      ) : (
        <div className="bg-white w-1/3 p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Upload Files</h2>
          {showBatch && (
            <>
              <div className="flex items-center space-x-2 mb-4">
                <select
                  value={selectedBatch?.name || ""}
                  onChange={handleBatchChange}
                  className="border border-blue-300 p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Batch Name"
                >
                  <option value="" disabled>
                    -- Select Batch --
                  </option>
                  {batches?.map((batch) => (
                    <option key={batch.id} value={batch.name}>
                      {batch.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setCreateBatchOpen(true)}
                  className="bg-blue-500 text-sm text-white py-1 px-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  Create batch
                </button>
              </div>
              {selectedBatch && (
                <div className="mb-4 p-2 border border-blue-300 rounded-lg bg-blue-50">
                  <h3 className="text-lg font-semibold text-blue-700">
                    Description
                  </h3>
                  <p className="text-blue-600">{selectedBatch.description}</p>
                </div>
              )}
            </>
          )}
          <input
            type="file"
            multiple
            accept=".pdf, .jpeg, .png, .jpg"
            onChange={handleFileChange}
            className="border border-blue-300 p-2 mb-4 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Upload Files"
          />
          {selectedFiles && !submitted && (
            <FileList files={selectedFiles} onDelete={handleDeleteFile} />
          )}
          {submitted && <ProgressBar progress={uploadProgress} />}
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleClose}
              className="bg-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadModal;
