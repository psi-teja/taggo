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
import { Project, TOOL_CONFIG } from "@/app/components/Project";
import { ArrowLeft, Tag } from "lucide-react";
import { Loader2 } from "lucide-react";

interface AppHeaderProps {
  loggedInUser: User | undefined;
  project: Project;
  navigation: string; // You can replace 'any' with the specific type if you have it defined
}

const AppHeader = ({ loggedInUser, project, navigation }: AppHeaderProps) => {
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
      formData.append("project_id", project.id); // Assuming task_type is a string
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
        <Link
          href={`/${navigation}`}
          className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={20} />
        </Link>

      </div>
      <div className="flex items-center space-x-2">
        {project?.task_type && TOOL_CONFIG[project.task_type as keyof typeof TOOL_CONFIG] && (
          <span className="mx-2 flex items-center">
            {(() => {
              const config = TOOL_CONFIG[project.task_type as keyof typeof TOOL_CONFIG];
              const Icon = config.icon;
              // Apply the Tailwind color class directly to the Icon or the Wrapper
              return <Icon className={config.color} size={20} />;
            })()}
          </span>
        )}
        <h1 className="text-xl font-bold text-teal-900 p-1">
          {project?.name}
        </h1>
      </div>
      <div className="flex items-center space-x-2">
        <Link
          href={`/${project.task_type}/schema/${project.id}`}
          className="relative text-sm font-medium px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
          title="Invoice Annotation Schema"
        >
          Schema
        </Link>
        {loggedInUser?.is_superuser && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            disabled={isLoading}
            className={`
    group relative px-6 py-2.5 rounded-xl font-bold text-sm tracking-tight
    flex items-center gap-2 overflow-hidden transition-all duration-300
    bg-gradient-to-br from-brand-500 to-brand-600 text-white
    shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_-2px_rgba(20,184,166,0.3)]
    hover:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_8px_20px_-4px_rgba(20,184,166,0.4)]
    hover:-translate-y-0.5 active:translate-y-0
    disabled:opacity-50 disabled:cursor-not-allowed
    ${isLoading ? "opacity-70 pointer-events-none" : ""}
  `}
          >
            {/* Subtle Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlusIcon className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
            )}

            <span className="relative whitespace-nowrap">
              {isLoading ? "Uploading..." : "Upload Files"}
            </span>
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
