"use client";
import Tasks from "@/app/components/Tasks";
import AppHeader from "@/app/components/AppHeader";
import { useAuth } from "@/app/hooks/userAuth";
import { Project } from "@/app/components/Project";
import withAuth from "@/app/hooks/withAuth";

import { WithAuthProps } from "@/app/hooks/withAuth";

const ProjectDashboard = (props: WithAuthProps) => {
  const { loggedInUser } = useAuth();
  const { project } = props as { project?: Project };

  if (!project) {
    return (
      <div className="flex flex-col h-screen">
        <AppHeader loggedInUser={loggedInUser} task_type="" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-500">Project not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader loggedInUser={loggedInUser} task_type={project.task_type} />
      {(loggedInUser && project) ?
        <Tasks project={project} loggedInUser={loggedInUser} />:
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-gray-500">Loading project details...</p>
        </div>
      }
    </div>
  );
};

export default withAuth(ProjectDashboard);