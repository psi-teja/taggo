import React, { useState, useEffect } from 'react';
import axiosInstance from '@/app/components/axiosInstance';

const Tile = () => {
    const [data, setData] = useState<{
        total: number;
        inprogress: {
            [key: string]: number;
        };
        completed: number;
    } | null>(null);

    useEffect(() => {
        const fetchAnnotationsCount = async () => {
            const response = await axiosInstance.get('/get_annotations_count');
            setData(response.data);
        };
        fetchAnnotationsCount();
    }, []);

    return (
        <div className="tile bg-gradient-to-r from-green-200 via-blue-200 to-purple-200 shadow-lg rounded-lg p-6">
            <h2 className="text-3xl text-center font-bold text-gray-800 mb-6">
            Total Documents: {data ? data.total : 'Loading...'}
            </h2>
            <div className="flex justify-between mt-6">
            <div className="w-1/2 bg-blue-100 p-6 rounded-lg shadow-inner">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">
                In-Progress: {data ? Object.values(data.inprogress).reduce((acc: number, count: number) => acc + count, 0) : 'Loading...'}
                </h3>
                <ul className="list-disc list-inside text-blue-800">
                {data && Object.entries(data.inprogress).map(([key, value]) => (
                    <li key={key}>
                    {key}: {value}
                    </li>
                ))}
                </ul>
            </div>
            <div className="w-1/2 text-right bg-green-100 p-6 rounded-lg shadow-inner">
                <h3 className="text-xl font-semibold text-green-900">
                Completed: {data ? data.completed : 'Loading...'}
                </h3>
            </div>
            </div>
        </div>
    );
};

export default Tile;