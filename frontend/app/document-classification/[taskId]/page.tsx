"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/hooks/userAuth';
import { useTaskAndProjectDetails } from '@/app/hooks/useTaskAndProjectDetails';
import AppHeader from '@/app/components/AppHeader';
import ClassificationSpace from './components/ClassificationSpace';

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
                    navigation={`dashboard/${projectDetails.id}`}
                />
            )}
            <ClassificationSpace taskDetails={taskDetails} projectDetails={projectDetails} isEditor={isEditor} />
        </div>
    );
};

export default TaskPage;
