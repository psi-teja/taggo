import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { HiHome } from "react-icons/hi";
import { FaHistory } from "react-icons/fa";
import Header from "@/app/utils/Header";

interface TriageHeaderProps {
  doc_id: string | null;
  history: any[];
  handlePrevClick: () => void;
  handleNextClick: () => void;
  isEdit: boolean;
}

const TriageHeader: React.FC<TriageHeaderProps> = ({
  doc_id,
  history,
  handlePrevClick,
  handleNextClick,
  isEdit,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
      </div>
    );
  }

  return (
    <Header>
      <Link
        href="/labelling"
        className="text-teal-900 hover:underline flex items-center"
        onClick={() => setLoading(true)}
      >
        <HiHome className="m-1 text-2xl" />
        <p className="m-1 text-lg font-semibold">Home</p>
      </Link>
      <h1 className="text-xl font-bold text-teal-900 p-1">Annotation</h1>
      <div className="flex items-center justify-between text-teal-900 w-[30vw] relative">
        {isEdit !== false && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white text-xl px-2 rounded-l-lg shadow-md text-sm transition-colors duration-200"
            onClick={handlePrevClick}
          >
            <i className="m-1 fa fa-angle-left"></i>
          </button>
        )}
        <div className="flex flex-col mx-1 items-center overflow-hidden overflow-auto custom-scrollbar">
          <div className="flex items-center space-x-1">
            <p className="font-semibold text-sm">Doc ID:</p>
            <p className="text-sm text-gray-700">{doc_id}</p>
          </div>
          <div className="flex items-center space-x-2">
            <FaHistory
              className="text-lg text-gray-700 hover:text-blue-500 cursor-pointer"
              onClick={() => setShowHistory(!showHistory)}
            />
            <p className="text-gray-700 text-sm">
              {history ? `${history[history.length - 1]}` : ""}
            </p>
          </div>

          {showHistory && (
            <div 
            onMouseLeave={() => setShowHistory(false)}
            className="absolute top-16 left-0 right-0 z-50 bg-white border border-gray-300 shadow-lg p-2 rounded-lg">
              <h3 className="text-sm font-bold text-teal-900 mb-2">History</h3>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {history && history.length > 0 ? (
                  <ul className="text-gray-700 text-sm">
                    {history.map((item, index) => (
                      <li
                        key={index}
                        className="py-1 border-b last:border-none hover:bg-gray-100 transition-colors"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No history available.</p>
                )}
              </div>
            </div>
          )}
        </div>
        {isEdit !== false && (
            <button
            className="bg-blue-500 hover:bg-blue-700 text-white text-xl px-2 rounded-r-lg shadow-md text-sm transition-colors duration-200 h-full"
            onClick={handleNextClick}
            >
            <i className="m-1 fa fa-angle-right"></i>          
            </button>
        )}
      </div>
    </Header>
  );
};

export default TriageHeader;
