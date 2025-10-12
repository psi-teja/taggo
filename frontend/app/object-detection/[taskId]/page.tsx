"use client";
import React, { useEffect, useState } from 'react';
import axiosInstance from '@/app/hooks/axiosInstance';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/hooks/userAuth';
import Header from '@/app/components/Header';
import Link from 'next/link';
import { FaCrosshairs } from 'react-icons/fa';
import AccountDetails from '@/app/components/AccountDetails';
import InteractiveSpace from './components/InteractiveSpace';

const TaskPage: React.FC = () => {
  const { taskId } = useParams();
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const { loggedInUser } = useAuth();
  const [isEditor, setIsEditor] = useState<boolean>(false);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const response = await axiosInstance.get(`/tasks/${taskId}`);
        const data = response.data;
        setTaskDetails(data);
        setIsEditor(!!(data && data.assigned_to_user === loggedInUser?.username));
      } catch (error: any) {
        alert('Error fetching task details: ' + (error?.message || 'unknown'));
      }
    };
    fetchTaskDetails();
  }, [taskId]);

  return (
    <div className="flex flex-col h-screen">
      <Header>
        <Link href="/object-detection" className="flex items-center gap-2 text-xl font-bold text-teal-900 hover:text-blue-900 transition-colors">
          <FaCrosshairs className="text-purple-500 text-xl" />
          <span>Object Detection</span>
        </Link>
        <AccountDetails loggedInUser={loggedInUser} />
      </Header>
      <InteractiveSpace taskDetails={taskDetails} isEditor={isEditor} />
    </div>
  );
};

export default TaskPage;
