import Image from "next/image";
import Link from "next/link";
import { useState, ChangeEvent, use } from "react";
import axiosInstance from "./axiosInstance";
import AccountDetails from "./AccountDetails";
import { PlusIcon } from "@heroicons/react/24/outline";
import UploadModal from "./UploadModal";
import Header from "@/app/components/Header";
import Logo from "./Logo";

interface AppHeaderProps {
  userData: {
    username: string;
    email: string;
    groups: string[];
    is_superuser: boolean;
  } | null;
  task_type: string;
}

const AppHeader = ({ userData, task_type}: AppHeaderProps) => {
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
        {userData?.is_superuser && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className={`cursor-pointer text-sm bg-blue-500 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center shadow-md hover:shadow-lg transition duration-200 ${
              isLoading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <PlusIcon className="h-4 w-4 mr-2 text-white" />
            {isLoading ? "Uploading..." : "Upload Files"}
          </button>
        )}
        {userData && <AccountDetails userData={userData} />}
      </div>
      {userData?.is_superuser && (
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
