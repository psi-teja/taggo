"use client";
import React, { useEffect, useState } from 'react';
import axiosInstance from '@/app/hooks/axiosInstance';
import { useParams } from 'next/navigation'; // For Next.js 13+ with app directory
import { useAuth } from '@/app/hooks/userAuth';
import InteractiveSpace from './components/InteractiveSpace';
import { Project } from '@/app/components/Project';
import { Task } from '@/app/components/Tasks';
import AppHeader from '@/app/components/AppHeader';

const TaskPage: React.FC = () => {
    const { taskId } = useParams(); // Extract taskId from the dynamic route
    const [taskDetails, setTaskDetails] = useState<Task | null>(null);
    const [projectDetails, setProjectDetails] = useState<Project | null>(null);
    const { loggedInUser } = useAuth();
    const [isEditor, setIsEditor] = useState<boolean>(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // 1. Fetch Task
                const taskResponse = await axiosInstance.get(`/tasks/${taskId}`);
                const data = taskResponse.data;

                if (!data) return;

                // Set state (will be available on NEXT render)
                setTaskDetails(data);

                // 2. Fetch Project (Use 'data' directly, NOT the 'taskDetails' state)
                const projectResponse = await axiosInstance.get(`/projects/${data.project_id}`);
                setProjectDetails(projectResponse.data);

                // 3. Permission Logic
                // Note: Check if your backend returns an object for assigned_to_user 
                // If it's an object, use data.assigned_to_user.username
                const assigneeUsername = typeof data.assigned_to_user === 'object'
                    ? data.assigned_to_user?.username
                    : data.assigned_to_user;

                const isAssigned = assigneeUsername === loggedInUser?.username;
                const isSuper = loggedInUser?.is_superuser === true;

                setIsEditor(isAssigned || isSuper);

            } catch (error) {
                console.error("Fetch error:", error);
                const message = error instanceof Error ? error.message : 'An unknown error occurred.';
                alert('Error fetching details: ' + message);
            }
        };

        if (taskId && loggedInUser) {
            fetchDetails();
        }
    }, [taskId, loggedInUser]); // Added loggedInUser to dependencies to ensure comparison works

    return (
        <div className="flex flex-col h-screen">
            {projectDetails && (
                <AppHeader 
                    loggedInUser={loggedInUser} 
                    project={projectDetails} 
                    navigation={`dashboard/${projectDetails.id}`} // Pass project ID for correct navigation
                />
            )}
            <InteractiveSpace taskDetails={taskDetails} isEditor={isEditor} />
        </div>
    );
};

export default TaskPage;
