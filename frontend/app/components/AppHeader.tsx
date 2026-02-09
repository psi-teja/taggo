import Image from "next/image";
import Link from "next/link";
import { useState, ChangeEvent, use } from "react";
import axiosInstance from "../hooks/axiosInstance";
import AccountDetails from "./AccountDetails";
import { PlusIcon } from "@heroicons/react/24/outline";
import UploadModal from "./UploadModal";
import Header from "@/app/components/Header";
import Logo from "./Logo";
import { User } from "./User";

interface AppHeaderProps {
  loggedInUser: User | undefined;
  task_type: string;
}

const AppHeader = ({ loggedInUser, task_type}: AppHeaderProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [failedFiles, setFailedFiles] = useState<
    { name: string; message: string }[]
  >([]);
  const [uploadDone, setUploadDone] = useState<boolean>(false);

  const handleFileUpload = async (
    files: FileList,
  ): Promise<void> => {
    setIsLoading(true); // Set loading state to true
    setFailedFiles([]); // Reset failed files
    const totalFiles = files.length;
    let uploadedFiles = 0;

    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("task_type", task_type); // Assuming task_type is a string
      try {
        const response = await axiosInstance.post(
          "/tasks/create",
          formData, // Pass FormData directly
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 200) {
          console.log("File uploaded successfully");
        } else {
          console.error("Failed to upload file:", response.statusText);
          setFailedFiles((prev) => [
            ...prev,
            { name: file.name, message: response.statusText },
          ]);
        }
      } catch (error: any) {
        console.error(
          "Error during file upload:",
          error.response?.data.message || error.message
        );
        setFailedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            message: error.response?.data.message || error.message,
          },
        ]);
      } finally {
        uploadedFiles += 1;
        setUploadProgress((uploadedFiles / totalFiles) * 100);
      }
    });

    await Promise.all(uploadPromises);
    setIsLoading(false); // Set loading state back to false
    setUploadProgress(0); // Reset upload progress
    setUploadDone(true); // Set upload done state to true
  };

  return (
    <Header>
      <div className="flex items-center space-x-2">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <h1 className="text-xl font-bold text-teal-900 p-1">
        {task_type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </h1>
      <div className="flex items-center space-x-2">
        {loggedInUser?.is_superuser && task_type === 'invoice-annotation' && (
          <Link
            href="/invoice-annotation/schema"
            className="relative text-sm font-medium px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            title="Invoice Annotation Schema"
          >
            Schema
          </Link>
        )}
        {loggedInUser?.is_superuser && task_type === 'object-detection' && (
          <Link
            href="/object-detection/schema"
            className="relative text-sm font-medium px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
            title="Object Detection Schema"
          >
            Schema
          </Link>
        )}
        {loggedInUser?.is_superuser && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className={`relative cursor-pointer text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 shadow-md shadow-teal-900/10 border border-teal-400/40 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-white tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-teal-900/20 hover:-translate-y-0.5 hover:from-teal-600 hover:via-cyan-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-teal-300 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${
              isLoading ? "opacity-60 pointer-events-none" : ""
            }`}
            disabled={isLoading}
          >
            <PlusIcon className="h-4 w-4 text-white drop-shadow" />
            <span className="whitespace-nowrap">{isLoading ? "Uploading..." : "Upload Files"}</span>
            <span className="absolute inset-0 rounded-md bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
          </button>
        )}
        {loggedInUser && <AccountDetails loggedInUser={loggedInUser} />}
      </div>
      {loggedInUser?.is_superuser && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={(files) => {
            
              handleFileUpload(files);
            
          }}
          uploadProgress={uploadProgress}
          failedFiles={failedFiles}
          uploadDone={uploadDone}
          handleOk={() => {
            setIsUploadModalOpen(false);
            setUploadDone(false);
            window.location.reload();
          }}
        />
      )}
    </Header>
  );
};

export default AppHeader;
