"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "../hooks/axiosInstance";

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
  const [groupsWithUsers, setGroupsWithUsers] = useState<{
    [key: string]: string[];
  }>({});
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchID, setSearchID] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTaskHistory, setSelectedTaskHistory] = useState<
    { timestamp: string; action: string }[] | null
  >(null);
  const perPage = 20;

  const fetchTasks = async (
    assignee: string,
    status: string,
    page: number,
    searchID: string | null
  ) => {
    setLoading(true);
    setError(null);
    if (searchID === "") {
      searchID = null;
    }
    try {
      const response = await axiosInstance.get("/tasks/", {
        params: {
          assignee,
          status,
          perPage: perPage,
          page: page,
          searchID: searchID,
          task_type: task_type,
        },
      });
      if (response.status !== 200) {
        throw new Error("Failed to fetch data");
      }
      const data: Task[] = await response.data.tasks;
      setData(data);
      setLoading(false);
      setIsLastPage(response.data.is_last_page);
      setTotalTasks(response.data.total_Tasks);
    } catch (error: any) {
      setError(error.message);
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

  const changePage = (page: number) => {
    setCurrentPage(page);
  };

  const openHistoryModal = (history: { timestamp: string; action: string }[]) => {
    setSelectedTaskHistory(history);
  };

  const closeHistoryModal = () => {
    setSelectedTaskHistory(null);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto mt-4 overflow-hidden">
      <div className="overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
          </div>
        ) : (
          <table className="table-auto w-full border-collapse border border-gray-300 mt-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">ID</th>
                <th className="border border-gray-300 px-4 py-2">Assignee</th>
                <th className="border border-gray-300 px-4 py-2">Status</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item: Task) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-100 transition duration-300"
                >
                  <td className="border border-gray-300 px-4 py-2">{item.id}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {loggedInUser && loggedInUser.is_superuser ? (
                      <select
                        id="user-select"
                        className="select-user-dropdown text-black rounded-md p-2 border"
                        value={item.assigned_to_user ?? ""}
                      >
                        <option value="" className="text-gray-400">
                          --select--
                        </option>
                        {Object.entries(groupsWithUsers).map(
                          ([group, users]) => (
                            <optgroup key={group} label={group}>
                              {users.map((user: string) => (
                                <option key={user} value={user}>
                                  {user}
                                </option>
                              ))}
                            </optgroup>
                          )
                        )}
                      </select>
                    ) : (
                      <p>{item.assigned_to_user}</p>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {item.status}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 flex gap-2">
                    <Link
                      href={{
                        pathname: `/invoice-parsing/${item.id}`,
                      }}
                      className="text-blue-500 hover:underline"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => openHistoryModal(item.history)}
                      className="text-blue-500 hover:underline"
                    >
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* History Modal */}
      {selectedTaskHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-3/4 max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Task History</h2>
            <ul className="space-y-2">
              {selectedTaskHistory.map((entry, index) => (
                <li key={index} className="border-b pb-2">
                  <p>
                    <strong>Timestamp:</strong> {entry.timestamp}
                  </p>
                  <p>
                    <strong>Action:</strong> {entry.action}
                  </p>
                </li>
              ))}
            </ul>
            <button
              onClick={closeHistoryModal}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
