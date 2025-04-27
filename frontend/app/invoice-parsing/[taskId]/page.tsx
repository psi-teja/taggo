"use client";
import React, { useEffect } from 'react';
import axiosInstance from '@/app/hooks/axiosInstance';
import { useParams } from 'next/navigation'; // For Next.js 13+ with app directory
import { useAuth } from '@/app/hooks/userAuth';
import Header from '@/app/components/Header';
import Logo from '@/app/components/Logo';

const TaskPage: React.FC = () => {
    const { taskId } = useParams(); // Extract taskId from the dynamic route
    const [taskDetails, setTaskDetails] = React.useState<any>(null);
    const { loggedInUser } = useAuth();


    // You can use taskId to fetch data or perform any other operations
    useEffect(() => {
        // Example: Fetch task details using taskId
        const fetchTaskDetails = async () => {
            try {
                const response = await axiosInstance.get(`/tasks/${taskId}`);
                const data = response.data;
                setTaskDetails(data);
            } catch (error) {
                if (error instanceof Error) {
                    alert('Error fetching task details: ' + error.message);
                } else {
                    alert('Error fetching task details: An unknown error occurred.');
                }
            }
        };
        fetchTaskDetails();
    })

    return (
        <div>
            <Header>
                <Logo/>
                <h1 className="text-2xl font-bold">Invoice Parsing</h1>
                <div className="flex items-center space-x-2">
                    <h2 className="text-xl">{taskId}</h2>
                </div>
            </Header>

        </div>
    );
};

export default TaskPage;
