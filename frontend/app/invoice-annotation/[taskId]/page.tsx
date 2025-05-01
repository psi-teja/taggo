"use client";
import React, { useEffect, useState } from 'react';
import axiosInstance from '@/app/hooks/axiosInstance';
import { useParams } from 'next/navigation'; // For Next.js 13+ with app directory
import { useAuth } from '@/app/hooks/userAuth';
import Header from '@/app/components/Header';
import Link from 'next/link';
import { FaFileInvoice } from 'react-icons/fa';
import InteractiveSpace from './components/InteractiveSpace';
import AccountDetails from '@/app/components/AccountDetails';

const TaskPage: React.FC = () => {
    const { taskId } = useParams(); // Extract taskId from the dynamic route
    const [taskDetails, setTaskDetails] = useState<any>(null);
    const { loggedInUser } = useAuth();
    const [isEditor, setIsEditor] = useState<boolean>(false);


    // You can use taskId to fetch data or perform any other operations
    useEffect(() => {
        // Example: Fetch task details using taskId
        const fetchTaskDetails = async () => {
            try {
                const response = await axiosInstance.get(`/tasks/${taskId}`);
                const data = response.data;
                setTaskDetails(data);
                console.log('Task details:', data);
                if (data && data.assigned_to_user === loggedInUser?.username) {
                    setIsEditor(true);
                } else {
                    setIsEditor(false);
                }
            } catch (error) {
                if (error instanceof Error) {
                    alert('Error fetching task details: ' + error.message);
                } else {
                    alert('Error fetching task details: An unknown error occurred.');
                }
            }
        };
        fetchTaskDetails();
    }, [taskId]);

    console.log(setIsEditor);

    return (
        <div className="flex flex-col h-screen">
            <Header>
                <Link
                    href="/invoice-annotation"
                    className="flex items-center gap-2 text-xl font-bold text-teal-900 hover:text-blue-900 transition-colors"
                >
                    <FaFileInvoice className="text-purple-500 text-xl" />
                    <span>Invoice Annotation</span>
                </Link>
                <AccountDetails loggedInUser={loggedInUser} />
            </Header>
            <InteractiveSpace taskDetails={taskDetails} isEditor={isEditor} />
        </div>
    );
};

export default TaskPage;
