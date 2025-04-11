"use client";
import { Suspense } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import InteractiveSpace from "./components/InteractiveSpace";
import TriageHeader from "./components/TriageHeader";
import withAuth from "@/app/utils/withAuth";
import axiosInstance from "@/app/utils/axiosInstance";

const Triage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TriageContent />
    </Suspense>
  );
};

function TriageContent() {
  const searchParams = useSearchParams();
  const doc_id = searchParams.get("doc_id");
  const status = searchParams.get("status");
  const historyParam = searchParams.get("history");
  const username = searchParams.get("username");
  const edit = searchParams.get("edit") === "false" ? false : true;
  const [loading, setLoading] = useState(true);

  // Parse history if it exists
  const history = historyParam ? JSON.parse(historyParam) : null;

  const handleNextClick = async () => {
    setLoading(true);
    if (!doc_id) {
      console.error("Document ID is missing");
      return;
    }
    try {
      const response = await axiosInstance.get(`/get_next/${doc_id}/`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 200) {
        throw new Error("Network response was not ok");
      }
      const data = response.data;
      if (data.status === "success") {
        const annotation = data.annotation;
        if (annotation) {
          window.location.href = `/triage?doc_id=${
            annotation.id
          }&history=${JSON.stringify(annotation.history)}&status=${
            annotation.status
          }&username=${username}`;
        } else {
          alert("You are at the last document");
        }
      } else {
        alert(`Failed to get next document: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to send option:", error);
    }
    setLoading(false);
  };

  const handlePrevClick = async () => {
    setLoading(true);
    if (!doc_id) {
      console.error("Document ID is missing");
      return;
    }
    try {
      const response = await axiosInstance.get(`/get_prev/${doc_id}/`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 200) {
        throw new Error("Network response was not ok");
      }

      const data = response.data;
      if (data.status === "success") {
        const annotation = data.annotation;
        if (annotation) {
          window.location.href = `/triage?doc_id=${
            annotation.id
          }&history=${JSON.stringify(annotation.history)}&status=${
            annotation.status
          }&username=${username}`;
        } else {
          alert("You are at the first document");
        }
      } else {
        alert(`Failed to get next document: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to send option:", error);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <TriageHeader
        doc_id={doc_id}
        history={history}
        handlePrevClick={handlePrevClick}
        handleNextClick={handleNextClick}
        isEdit={edit}
      />
      {doc_id && status ? (
        loading ? (
          <InteractiveSpace
            doc_id={doc_id}
            status={status}
            handleNextClick={handleNextClick}
            isEdit={edit}
          />) : (
            <div className="flex items-center justify-center h-screen">
            <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
          </div>)
      ) : (
        <div>Invalid document ID or status</div>
      )}
    </div>
  );
}

export default withAuth(Triage);
