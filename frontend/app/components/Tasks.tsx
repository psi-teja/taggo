"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "../hooks/axiosInstance";
import PageNav from "./PageNav";

interface Task {
  id: string;
  selected: boolean;
  assigned_to_user: string | null;
  assigned_to_user_id: number | null;
  status: string;
  history: { timestamp: string; action: string }[];
}

interface TasksProps {
  task_type: string;
  loggedInUser: any;
}

const Tasks: React.FC<TasksProps> = ({ task_type, loggedInUser }) => {
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
  const [selectedTaskHistory, setSelectedTaskHistory] = useState<{ timestamp: string; action: string }[] | null>(null);
  const perPage = 20;

  const fetchTasks = async (assignee: string, status: string, page: number, searchID: string | null) => {
    setLoading(true);
    setError(null);
    if (searchID === "") searchID = null;
    try {
      const response = await axiosInstance.get("/tasks/", {
        params: { assignee, status, perPage, page, searchID, task_type },
      });
      if (response.status !== 200) throw new Error("Failed to fetch data");
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

  useEffect(() => {
    if (loggedInUser?.is_superuser) {
      const fetchGroupsWithUsers = async () => {
        const response = await axiosInstance.get("/get_groups_with_users");
        setGroupsWithUsers(response.data);
      };
      fetchGroupsWithUsers();
    }
  }, [loggedInUser]);

  const changePage = (page: number) => setCurrentPage(page);

  const openHistoryModal = (history: { timestamp: string; action: string }[]) => setSelectedTaskHistory(history);
  const closeHistoryModal = () => setSelectedTaskHistory(null);

  const uniqueStatuses = [
    "uploaded", "pre-labelled", "in-labelling", "in-review", "accepted", "completed"
  ].map(status => ({ value: status, label: status }));

  const getStatusBadge = (status: string) => {
    const colorMap: { [key: string]: string } = {
      "uploaded": "bg-green-100 text-green-800",
      "pre-labelled": "bg-yellow-100 text-yellow-800",
      "in-labelling": "bg-blue-100 text-blue-800",
      "in-review": "bg-indigo-100 text-indigo-800",
      "accepted": "bg-purple-100 text-purple-800",
      "completed": "bg-gray-100 text-gray-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorMap[status] || "bg-gray-200 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-2xl text-red-600 font-semibold mb-4">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2 px-6 rounded shadow"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50 overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="border-t-4 border-blue-500 rounded-full w-16 h-16 animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-y-auto">
          <table className="table-auto w-full border-collapse border border-gray-200">
            <thead className="sticky top-0 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-800 z-10">
              <tr>
                <th className="border border-gray-200 px-6 py-3 text-left font-semibold">
                    <div className="flex items-center space-x-2">
                    <span>ID</span>
                    <input
                      type="text"
                      value={searchID || ""}
                      onChange={(e) => setSearchID(e.target.value)}
                      placeholder="Search by ID"
                      className="text-black w-40 rounded-md border px-2 focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </th>
                <th className="border border-gray-200 px-6 py-3 text-left font-semibold">Assignee</th>
                <th className="border border-gray-200 px-6 py-3 text-left font-semibold">
                  <div className="flex items-center space-x-2">
                    <span>Status</span>
                    <select
                      className="text-black rounded-md  border focus:ring-2 focus:ring-blue-400"
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      value={selectedStatus}
                    >
                      <option value="all" className="text-gray-200">-- select --</option>
                      {uniqueStatuses.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item: Task, index: number) => (
                <tr key={item.id} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition duration-300`}>
                  <td className="border border-gray-200 px-6 py-3">{item.id}</td>
                  <td className="border border-gray-200 px-6 py-3">
                    {loggedInUser?.is_superuser ? (
                      <select
                        className="text-black rounded-md p-2 border w-full focus:ring-2 focus:ring-blue-400"
                        value={item.assigned_to_user ?? ""}
                      >
                        <option value="">--select--</option>
                        {Object.entries(groupsWithUsers).map(([group, users]) => (
                          <optgroup key={group} label={group}>
                            {users.map((user) => (
                              <option key={user} value={user}>{user}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    ) : (
                      <p>{item.assigned_to_user}</p>
                    )}
                  </td>
                  <td className="border border-gray-200 px-6 py-3">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PageNav totalTasks={totalTasks} perPage={perPage} currentPage={currentPage} changePage={changePage} />

      {/* History Modal */}
      {selectedTaskHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-3/4 max-w-2xl shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Task History</h2>
            <ul className="space-y-2">
              {selectedTaskHistory.map((entry, index) => (
                <li key={index} className="border-b pb-2 flex justify-between">
                  <p className="text-gray-700">{entry.action}</p>
                  <span className="text-sm text-blue-500">{entry.timestamp}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={closeHistoryModal}
              className="mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2 px-6 rounded shadow"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
