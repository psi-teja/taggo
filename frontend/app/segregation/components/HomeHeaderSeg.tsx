import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, ChangeEvent, use } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { PlusIcon } from "@heroicons/react/24/outline";
import UploadModal from "../../utils/UploadModal";
import AccountDetailsSeg from "./AccountDetailsSeg";
import Header from "@/app/utils/Header";

interface HomeHeaderProps {
  userData: {
    username: string;
    email: string;
    groups: string[];
    is_superuser: boolean;
  } | null;
}

const HomeHeaderSeg = ({ userData }: HomeHeaderProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [failedFiles, setFailedFiles] = useState<
    { name: string; message: string }[]
  >([]);
  const [uploadDone, setUploadDone] = useState<boolean>(false);
  const [data, setData] = useState<{
    total: number;
    inprogress: {
      [key: string]: number;
    };
  } | null>(null);

  useEffect(() => {
    const fetchAnnotationsCount = async () => {
      const response = await axiosInstance.get("/get_segregated_count");
      console.log("copuntttt", response.data);
      setData(response.data);
    };
    fetchAnnotationsCount();
  }, []);

  const handleFileUpload = async (files: FileList): Promise<void> => {
    setIsLoading(true); // Set loading state to true
    setFailedFiles([]); // Reset failed files
    const totalFiles = files.length;
    let uploadedFiles = 0;

    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append("document", file);

      try {
        const response = await axiosInstance.post(
          "/upload_document_seg/",
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
          <Image
            src={"/Tally-Logo.webp"}
            alt="Image"
            width={60}
            height={60}
            className=""
          />
        </Link>
      </div>
      <h1 className="text-xl font-bold text-teal-900 p-1">Segregation</h1>

      {userData?.is_superuser ? (
        <div className="tile justify-center text-center">

          <div className="flex gap-4 mt-2">
            <h3 className="font-semibold text-blue-900">
              Uploaded: {data ? data.inprogress.uploaded : "Loading..."}
            </h3>
            <h3 className="font-semibold text-blue-900">
              In-progress:
              {data ? data.inprogress["in-progress"] : "Loading..."}
            </h3>
            <h3 className="font-semibold text-blue-900">
              Segregated: {data ? data.inprogress.segregated : "Loading..."}
            </h3>
          </div>
        </div>
      ) : ( null
      )}
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
        {userData ? (
          <AccountDetailsSeg userData={userData} />
        ) : (
          <div className="loader border-t-4 border-blue-500 rounded-full w-6 h-6 mx-auto animate-spin"></div>
        )}
      </div>
      {userData?.is_superuser && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleFileUpload}
          uploadProgress={uploadProgress}
          failedFiles={failedFiles}
          uploadDone={uploadDone}
          handleOk={() => {
            setIsUploadModalOpen(false);
            setUploadDone(false);
            window.location.reload();
          }}
          showBatch={false}
        />
      )}
    </Header>
  );
};

export default HomeHeaderSeg;
