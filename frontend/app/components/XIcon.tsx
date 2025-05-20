import React from 'react';
import { XMarkIcon } from "@heroicons/react/24/outline";

const XIcon: React.FC = () => {
    return (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-0 transition-opacity duration-300 ease-in-out hover:opacity-100">
            <XMarkIcon className="h-7 w-7 text-red-500" />
        </div>
    );
};

export default XIcon;