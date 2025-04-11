"use client";
import { useState } from "react";
import LoginHeader from "../login/components/LoginHeader";

const TaskModules = () => {
  return (
    <div>
      <LoginHeader />
      <div className="flex justify-center items-center h-screen bg-yellow-100">
        <div className="m-5 flex justify-center items-center h-screen bg-yellow-100">
          <div
            className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full cursor-pointer"
            onClick={() => {
              window.location.href = "/labelling";
            }}
          >
            <h1 className="text-center mb-6 text-2xl text-gray-800 cursor-pointer">
              Labelling Task
            </h1>
          </div>
        </div>
        <div className="m-5 flex justify-center items-center h-screen bg-yellow-100">
          <div
            className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full cursor-pointer"
            onClick={() => {
              window.location.href = "/segregation";
            }}
          >
            <h1 className="text-center mb-6 text-2xl text-gray-800 cursor-pointer">
              Segregation Task
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModules;
