import React, { useState } from 'react';
import axios from 'axios';
import axiosInstance from './axiosInstance';

interface CreateBatchProps {
    handleClose: () => void;
}

interface Batch {
    name: string;
    description: string;
}

const CreateBatch: React.FC<CreateBatchProps> = ({handleClose}) => {
    const [batchName, setBatchName] = useState('');
    const [batchDescription, setBatchDescription] = useState('');

    const createBatch = async (batch: Batch) => {
        const batchName = batch.name;
        if (batchName === null) return; // Cancel the creation process if batchName is null

        const batchDescription = batch.description;
        if (batchDescription === null) 
            return; // Cancel the creation process if batchDescription is null

        if (batchName && batchDescription) {
            try {
                const response = await axiosInstance.post("/create_batch/", {
                    name: batchName,
                    description: batchDescription,
                });

                if (response.data.status === "success") {
                    alert("Batch created successfully.");
                    handleClose();
                } else {
                    alert(response.data.message);
                }
            } catch (error) {
                console.error("Error creating batch ", error);
                if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.message) {
                    alert(error.response.data.message);
                } else {
                    alert("Error creating batch.");
                }
            }
        } else {
            alert("Batch name and description is required.");
        }
    };

    return (
      <div className="p-4 w-1/3 border border-gray-200 rounded-lg shadow-lg bg-white">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-6">
          Create a New Batch
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createBatch({ name: batchName, description: batchDescription });
          }}
        >
          <div className="mb-6">
            <label
              htmlFor="batchName"
              className="block mb-2 text-lg font-medium text-gray-700"
            >
              Batch Name:
            </label>
            <input
              type="text"
              id="batchName"
              name="batchName"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value.replace(/\s/g, ""))}
              placeholder="Enter batch name"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="batchDescription"
              className="block mb-2 text-lg font-medium text-gray-700"
            >
              Batch Description:
            </label>
            <textarea
              id="batchDescription"
              name="batchDescription"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              value={batchDescription}
              onChange={(e) => setBatchDescription(e.target.value)}
              placeholder="Enter batch description"
            ></textarea>
          </div>
          <div className="flex justify-between">
            <button
              onClick={handleClose}
              className="w-full p-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-300 ease-in-out"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-full p-3 bg-blue-600 text-white rounded-lg ml-2 hover:bg-blue-700 transition duration-300 ease-in-out"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    );
};

export default CreateBatch;