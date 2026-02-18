import { useEffect, useState } from 'react';
import axiosInstance from '@/app/hooks/axiosInstance';
import { useAuth } from '@/app/hooks/userAuth';

export function useTaskAndProjectDetails(taskId: string | string[] | undefined) {
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [isEditor, setIsEditor] = useState(false);
  const { loggedInUser } = useAuth();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const taskResponse = await axiosInstance.get(`/tasks/${taskId}`);
        const data = taskResponse.data;
        if (!data) return;
        setTaskDetails(data);
        const projectResponse = await axiosInstance.get(`/projects/${data.project_id}`);
        setProjectDetails(projectResponse.data);
        const assigneeUsername = typeof data.assigned_to_user === 'object'
          ? data.assigned_to_user?.username
          : data.assigned_to_user;
        const isAssigned = assigneeUsername === loggedInUser?.username;
        const isSuper = loggedInUser?.is_superuser === true;
        setIsEditor(isAssigned || isSuper);
      } catch (error) {
        console.error('Fetch error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        // Replace alert with a better UI notification in production
        alert('Error fetching details: ' + message);
      }
    };
    if (taskId && loggedInUser) {
      fetchDetails();
    }
  }, [taskId, loggedInUser]);

  return { taskDetails, projectDetails, isEditor };
}
