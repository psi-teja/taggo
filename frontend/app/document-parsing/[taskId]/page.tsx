"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/hooks/userAuth';
import { useTaskAndProjectDetails } from '@/app/hooks/useTaskAndProjectDetails';
import InteractiveSpace from './components/InteractiveSpace';
import AppHeader from '@/app/components/AppHeader';

const TaskPage: React.FC = () => {
    const { taskId } = useParams();
    const { loggedInUser } = useAuth();
    const { taskDetails, projectDetails, isEditor } = useTaskAndProjectDetails(taskId);

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
