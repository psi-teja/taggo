"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "../hooks/axiosInstance";
import PageNav from "./PageNav";
import { FaHistory } from "react-icons/fa";
import { Project } from "./Project";
import { User } from "./User";

export type Task = {
  id: string;
  selected: boolean;
  assigned_to_user: User | null;
  status: string;
  history: { timestamp: string; action: string }[];
}

interface TasksProps {
  project: Project;
  loggedInUser: User;
}

const Tasks: React.FC<TasksProps> = ({ project, loggedInUser }) => {
  const [data, setData] = useState<Task[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [isLastPage, setIsLastPage] = useState<boolean>(false);
  const [groupsWithUsers, setGroupsWithUsers] = useState<{ [key: string]: string[] }>({});
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchID, setSearchID] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTaskID, setSelectedTaskID] = useState<string | null>(null);
  const [selectedTaskHistory, setSelectedTaskHistory] = useState<{ timestamp: string; action: string }[] | null>(null);
  const perPage = 20;

  const fetchTasks = async (assignee: string, status: string, page: number, searchID: string | null) => {
    setLoading(true);
    setError(null);
    if (searchID === "") searchID = null;
    try {
      const response = await axiosInstance.get(`/tasks/`, {
        params: { assignee, status, perPage, page, searchID, project_id: project.id},
      });
      if (response.status !== 200) throw new Error("Failed to fetch data");
      console.log("Fetched tasks:", response.data);
      setData(response.data.tasks);
      setIsLastPage(response.data.is_last_page);
      setTotalTasks(response.data.total_tasks);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(selectedAssignee, selectedStatus, currentPage, searchID);
  }, [currentPage, selectedAssignee, selectedStatus, searchID]);

  const uniqueStatuses = [
    "uploaded", "pre-labelled", "in-labelling", "in-review", "accepted", "completed"
  ].map(status => ({ value: status, label: status }));

  const getStatusBadge = (status: string) => {
    const colorMap: { [key: string]: string } = {
      uploaded: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
      "pre-labelled": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
      "in-labelling": "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/30",
      "in-review": "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-400/30",
      accepted: "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-inset ring-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:ring-fuchsia-400/30",
      completed: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:ring-slate-400/30",
    };
    return (
      <span
        className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide shadow-sm backdrop-blur-sm transition-colors ${
          colorMap[status] || "bg-gray-200 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300"
        }`}
      >
        {status}
      </span>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] bg-gradient-to-br from-rose-50 via-white to-teal-50 rounded-xl border border-red-100 mx-4 my-4 p-10 shadow-sm">
        <p className="text-xl text-red-600 font-semibold mb-6 flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" /> Error: {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-md bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium shadow hover:shadow-md transition active:scale-[.97]"
        >
          Refresh
        </button>
      </div>
    );
  }

  // Loading Skeleton
  const loadingSkeleton = (
    <div className="flex flex-col gap-4 p-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-12 w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse rounded-md" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white via-teal-50/60 to-cyan-50/60 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900/40 border border-teal-100/50 dark:border-teal-700/40 rounded-xl shadow-inner overflow-hidden backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-end p-4 border-b border-teal-100/60 dark:border-teal-700/40 bg-white/70 dark:bg-slate-800/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1">Search ID</label>
          <input
            type="text"
            value={searchID || ""}
            onChange={(e) => setSearchID(e.target.value)}
            placeholder="Type ID..."
            className="px-3 py-2 text-sm rounded-md bg-white/80 dark:bg-slate-700/70 border border-slate-200 dark:border-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition w-44 text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm rounded-md bg-white/80 dark:bg-slate-700/70 border border-slate-200 dark:border-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition w-44 text-slate-700 dark:text-slate-100"
          >
            <option value="all">All</option>
            {uniqueStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 tracking-wide uppercase">Total: {totalTasks}</span>
          <span className={`h-2.5 w-2.5 rounded-full ${isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} title={isLoading ? "Loading" : "Live"} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 overflow-auto">{loadingSkeleton}</div>
      ) : (
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 text-white text-left">
                <th className="px-5 py-3 font-semibold tracking-wide rounded-tl-md">ID</th>
                <th className="px-5 py-3 font-semibold tracking-wide">Assignee</th>
                <th className="px-5 py-3 font-semibold tracking-wide rounded-tr-md">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((item: Task, index: number) => (
                <tr
                  key={item.id}
                  className={`group border-b border-slate-100/70 last:border-0 hover:bg-white/70 transition-colors ${
                    index % 2 === 0 ? "bg-white/60" : "bg-white/40"
                  }`}
                >
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs tracking-tight text-slate-700 bg-slate-100/70 px-2 py-1 rounded-md w-fit shadow-inner">
                        {item.id}
                      </span>
                      <button
                        onClick={() => setSelectedTaskHistory(item.history)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 hover:text-teal-700 transition"
                      >
                        <FaHistory className="h-3 w-3" /> History
                      </button>
                      {item.history.length > 0 && (
                        <span className="text-[11px] text-slate-500 italic line-clamp-1">
                          {item.history[item.history.length - 1].action}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    {loggedInUser?.is_superuser ? (
                      <select
                        className="text-slate-700 rounded-md px-2 py-1 bg-white/70 border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-300 text-xs shadow-sm"
                        value={item.assigned_to_user ? item.assigned_to_user.username : ""}
                      >
                        <option value="">-- unassigned --</option>
                        {Object.entries(groupsWithUsers).map(([group, users]) => (
                          <optgroup key={group} label={group}>
                            {users.map((user) => (
                              <option key={user} value={user}>
                                {user}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-medium text-slate-600 px-2 py-1 bg-slate-100 rounded-md shadow-inner">
                        {item.assigned_to_user ? item.assigned_to_user.username : "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <Link
                      href={`/${project.task_type}/${item.id}`}
                      className="inline-flex items-center group/status"
                      title="Open task"
                    >
                      {getStatusBadge(item.status)}
                    </Link>
                  </td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No tasks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && (
        <div className="border-t border-teal-100/60 dark:border-teal-700/40 bg-white/70 dark:bg-slate-800/70">
          <PageNav
            totalTasks={totalTasks}
            perPage={perPage}
            currentPage={currentPage}
            changePage={(page: number) => setCurrentPage(page)}
          />
        </div>
      )}

      {selectedTaskHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-xl p-6 w-full max-w-xl shadow-xl border border-slate-200 dark:border-slate-600 relative animate-scaleIn">
            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FaHistory className="text-teal-600 dark:text-teal-400" /> Task History
            </h2>
            <ul className="space-y-2 max-h-72 overflow-auto pr-2 custom-scrollbar-sm">
              {selectedTaskHistory.map((entry, index) => (
                <li
                  key={index}
                  className="rounded-md border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-700/60 px-3 py-2 flex flex-col gap-0.5 text-xs"
                >
                  <p className="text-slate-700 dark:text-slate-100 font-medium">{entry.action}</p>
                  <span className="text-[10px] uppercase tracking-wide text-teal-600 dark:text-teal-400 font-semibold">
                    {entry.timestamp}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTaskHistory(null)}
                className="px-5 py-2 rounded-md bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium shadow hover:shadow-md active:scale-[.97]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
