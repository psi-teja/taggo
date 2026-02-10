"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaHistory, FaSearch, FaFilter, FaChevronRight } from "react-icons/fa";
import { Loader2, Inbox, User as UserIcon, Clock } from "lucide-react";
import axiosInstance from "../hooks/axiosInstance";
import PageNav from "./PageNav";
import { Project } from "./Project";
import { User } from "./User";

// --- Types ---
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
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchID, setSearchID] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTaskHistory, setSelectedTaskHistory] = useState<{ timestamp: string; action: string }[] | null>(null);
  
  const perPage = 20;

  const fetchTasks = async (assignee: string, status: string, page: number, query: string) => {
  setLoading(true);
  try {
    const response = await axiosInstance.get(`/tasks/`, {
      params: { assignee, status, perPage, page, searchID: query || null, project_id: project.id },
    });
    
    // Defensive check: Ensure we are setting an array even if the API sends null
    setData(response.data.tasks || []); 
    setTotalTasks(response.data.total_tasks || 0);
  } catch (err: any) {
    setError(err.message);
    setData([]); // Reset to empty array on error to prevent .map crashes
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTasks(selectedAssignee, selectedStatus, currentPage, searchID);
    }, 300); // Debounce search
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, selectedAssignee, selectedStatus, searchID]);

  const getStatusStyle = (status: string) => {
    const map: { [key: string]: string } = {
      uploaded: "bg-blue-50 text-blue-700 border-blue-100",
      "pre-labelled": "bg-purple-50 text-purple-700 border-purple-100",
      "in-labelling": "bg-amber-50 text-amber-700 border-amber-100",
      "in-review": "bg-indigo-50 text-indigo-700 border-indigo-100",
      accepted: "bg-emerald-50 text-emerald-700 border-emerald-100",
      completed: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return map[status] || "bg-gray-50 text-gray-600";
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border-2 border-dashed border-red-100">
      <div className="p-4 bg-red-50 rounded-full mb-4"><Inbox className="text-red-400" size={32} /></div>
      <p className="text-slate-900 font-bold text-lg">Failed to sync tasks</p>
      <p className="text-slate-500 mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all">Retry Sync</button>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Integrated Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
            <Inbox size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">Project Tasks</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{totalTasks} Items Total</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{isLoading ? 'Syncing...' : 'Live'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Sleek Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by ID..."
              value={searchID}
              onChange={(e) => setSearchID(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all w-full md:w-64 font-medium"
            />
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-slate-50 border border-slate-200 rounded-2xl">
             <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent pl-3 pr-8 py-1.5 text-xs font-bold text-slate-600 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {["uploaded", "in-labelling", "in-review", "accepted", "completed"].map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Task Table Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        {isLoading && data.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-teal-500" size={40} />
            <p className="text-slate-400 font-medium">Fetching workspace tasks...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Identification</th>
                  <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment</th>
                  <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Status</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((task) => (
                  <tr key={task.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                    <td className="px-8 py-6">
                      <div className="flex flex-col space-y-1.5">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md w-fit group-hover:bg-white group-hover:text-teal-600 transition-colors">
                          {task.id.slice(0, 8)}...
                        </span>
                        <button 
                          onClick={() => setSelectedTaskHistory(task.history)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-teal-500 uppercase tracking-wider transition-colors"
                        >
                          <Clock size={12} /> View History
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
                          <UserIcon size={14} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          {task.assigned_to_user?.username || "Pending Assignment"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link
                        href={`/${project.task_type}/${task.id}`}
                        className="p-2 inline-flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-teal-600 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-50 transition-all"
                      >
                        <FaChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center">
                <Inbox className="text-slate-200 mb-2" size={48} />
                <p className="text-slate-400 font-medium">No tasks found in this queue.</p>
              </div>
            )}
          </div>
        )}
        
        {/* 4. Pagination Footer */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <PageNav
            totalTasks={totalTasks}
            perPage={perPage}
            currentPage={currentPage}
            changePage={(page: number) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* 5. History Modal Redesign */}
      {selectedTaskHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedTaskHistory(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl"><FaHistory /></div>
                <h3 className="text-lg font-black text-slate-900">Task Audit Trail</h3>
              </div>
              <button onClick={() => setSelectedTaskHistory(null)} className="text-slate-300 hover:text-slate-900 transition-colors font-bold">Close</button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {selectedTaskHistory.length > 0 ? selectedTaskHistory.map((entry, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5" />
                    <div className="w-px flex-1 bg-slate-100 my-1" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{entry.action}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{entry.timestamp}</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-slate-400 py-10">No history available for this task.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;