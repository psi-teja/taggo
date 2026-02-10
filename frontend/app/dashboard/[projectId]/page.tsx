"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Tasks from "@/app/components/Tasks";
import AppHeader from "@/app/components/AppHeader";
import { useAuth } from "@/app/hooks/userAuth";
import { Project } from "@/app/components/Project";
import withAuth, { WithAuthProps } from "@/app/hooks/withAuth";
import { ArrowLeft, Loader2, LayoutGrid } from "lucide-react";
import axiosInstance from "@/app/hooks/axiosInstance";

const ProjectDashboard = (props: WithAuthProps) => {
  const { loggedInUser } = useAuth();
  const params = useParams(); // Get ID from URL directly for refreshes
  
  // Initialize state with props, but allow it to be updated by fetch
  const [project, setProject] = useState<Project | null>((props as any).project || null);
  const [isLoading, setIsLoading] = useState(!project);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      // Use the ID from params if the project prop is missing (on refresh)
      const projectId = project?.id || params.projectId;
      
      if (!projectId) return;

      try {
        const response = await axiosInstance.get(`/projects/${projectId}/`);
        setProject(response.data);
      } catch (error) {
        console.error('Error fetching project details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [params.id]); 

  // If we are loading or project is still undefined, show a loader
  // This prevents AppHeader from getting an 'undefined' task_type
  if (isLoading || !project) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Loading Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Now guaranteed to have a project object here */}
      <AppHeader 
        loggedInUser={loggedInUser} 
        project={project} 
        navigation="dashboard"
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {loggedInUser && (
            <div className="p-8">
              <Tasks project={project} loggedInUser={loggedInUser} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default withAuth(ProjectDashboard);  