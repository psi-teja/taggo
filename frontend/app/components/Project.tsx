// Define the data type (can be moved to a separate file if reused)
export type Project = {
    id: string;
    name: string;
    task_type: string;
};

// UI component receives a Project as prop
const ProjectCard = ({ project }: { project: Project }) => {
    return (
        <a
            href={`dashboard/${project.id}`}
            className="bg-gradient-to-br from-brand-50 via-bg-alt to-accent-500 p-4 rounded shadow-sm hover:shadow-md transition border border-brand-100 block cursor-pointer"
        >
            <h2 className="text-lg font-semibold text-brand-700">{project.name}</h2>
            <p className="text-sm text-accent-500 font-medium mb-1">{project.task_type}</p>
        </a>
    );
};

export default ProjectCard;