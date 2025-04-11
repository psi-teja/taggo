import React, { useState } from 'react';

interface Option {
    label: string;
    value: string;
}

interface MultiSelectProps {
    handleSelectAll: () => void;
    handleDelete: () => void;
    selectedIds: Set<string>;
    isDeleting: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ handleSelectAll, handleDelete, selectedIds, isDeleting }) => {
    return (
        <div className="flex space-x-2 p-2 bg-gray-100 rounded-md">
            <button onClick={handleSelectAll} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none text-sm">
            Select All
            </button>
            <button
            onClick={handleDelete}
            disabled={selectedIds.size === 0}
            className={`flex items-center px-2 py-1 rounded focus:outline-none text-sm ${selectedIds.size === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
            {isDeleting && <div className="loader border-t-4 border-blue-500 rounded-full w-4 h-4 mr-2 animate-spin"></div>}
            Delete
            </button>
        </div>
    );
};

export default MultiSelect;