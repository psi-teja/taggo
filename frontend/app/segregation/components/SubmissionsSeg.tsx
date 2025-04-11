"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "@/app/utils/axiosInstance";
import SmartAssign from "@/app/utils/SmartAssign";
import MultiSelect from "@/app/utils/MultiSelect";
import PageNav from "@/app/utils/PageNav";

interface Annotation {
  id: string;
  assigned_to_user: string | null;
  assigned_to_user_id: number | null;
  status: string;
  history: any[];
  invoice_type: string;
  invoice_subtype: string;
}

interface SubmissionsProps {
  userData: {
    username: string;
    email: string;
    is_superuser: boolean;
    groups: string[];
  } | null;
}

const SubmissionsSeg: React.FC<SubmissionsProps> = ({ userData }) => {
  const [data, setData] = useState<Annotation[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAnnotations, setTotalAnnotations] = useState<number>(0);
  const [isLastPage, setIsLastPage] = useState<boolean>(false);
  const [hoveredRowID, sethoveredRowID] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<boolean>(false);
  const [groupsWithUsers, setGroupsWithUsers] = useState<{
    [key: string]: string[];
  }>({});
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [serachID, setSearchID] = useState<string | null>(null);
  const [showCheckboxes, setShowCheckboxes] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filter states for each column
  const [triageReady, setTriageReady] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const perPage = 20;

  const fetchAnnotations = async (
    assignee: string,
    status: string,
    page: number,
    searchID: string | null
  ) => {
    console.log(":fetch annotations");
    setLoading(true);
    setError(null);
    if (searchID === "") {
      searchID = null;
    }
    try {
      const response = await axiosInstance.get(
        `/get_segregations/${assignee}/${status}/${perPage}/${page}/${searchID}`
      );
      console.log("response", response);
      if (response.status !== 200) {
        throw new Error("Failed to fetch data");
      }
      const data: Annotation[] = await response.data.segregations;
      setData(data);
      setLoading(false);
      setIsLastPage(response.data.is_last_page);
      setTotalAnnotations(response.data.total_segregations);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnotations(selectedAssignee, selectedStatus, currentPage, serachID);
  }, [currentPage, selectedAssignee, selectedStatus, serachID]);

  useEffect(() => {
    if (userData?.is_superuser) {
      const fetchGroupsWithUsers = async () => {
        const response = await axiosInstance.get("/get_groups_with_users_seg/");
        console.log("user", response.data);
        setGroupsWithUsers(response.data);
      };
      fetchGroupsWithUsers();
    }
  }, [userData]);

  // Extract unique values for dropdowns
  const uniqueStatuses = ["uploaded", "in-progress", "segregated"].map(
    (status) => ({
      value: status,
      label: status,
    })
  );

  const handleUserChange = async (id: string, username: string | null) => {
    try {
      const response = await axiosInstance.post("/assign_segregation", {
        id,
        username,
      });

      if (response.status === 200) {
        console.log("User assigned successfully");
        setData((prevData: Annotation[]) =>
          prevData.map((annotation: Annotation) =>
            annotation.id === id
              ? {
                  ...annotation,
                  assigned_to_user:
                    Object.values(groupsWithUsers)
                      .flat()
                      .find((user: string) => user === username) || null,
                }
              : annotation
          )
        );
        return true;
      } else {
        console.error("Failed to assign user:", response.statusText);
        return false;
      }
    } catch (error: any) {
      console.error(
        "Error assigning user:",
        error.response?.data.message || error.message
      );
      return false;
    }
  };

  const [showDialog, setShowDialog] = useState<boolean>(false);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl text-red-500 mb-4">Error: {error}</p>{" "}
        {/* Error message */}
        <button
          onClick={() => window.location.reload()} // Refresh the page on button click
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (triageReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
      </div>
    );
  }

  const changePage = (page: number) => {
    setCurrentPage(page);
  };

  function handleCloseClick(): void {
    setShowDialog(false);
  }

  const handleSmartAssign = async (
    status: string | null,
    userGroup: string | null,
    totalCount: number | null,
    userFileDistribution: {
      [key: string]: { percentage: number; files: number } | null;
    }
  ) => {
    const userPercentagesArray = userFileDistribution
      ? Object.entries(userFileDistribution)
          .map(([userId, user]) =>
            user
              ? {
                  userId,
                  files: user.files,
                }
              : null
          )
          .filter(Boolean)
      : [];

    try {
      const response = await axiosInstance.post("/smart_assign_seg/", {
        status,
        userGroup,
        totalCount,
        userFileDistribution: userPercentagesArray,
      });
      if (response.status === 200) {
        fetchAnnotations(
          selectedAssignee,
          selectedStatus,
          currentPage,
          serachID
        );
        setShowDialog(false);
        alert("Smart assign successful: " + response.data.message);
      } else {
        throw new Error("Failed to perform smart assign");
      }
    } catch (error: any) {
      console.error(
        "Error during smart assign:",
        error.response?.data.message || error.message
      );
      alert(
        "Error during smart assign: " +
          (error.response?.data.message || error.message)
      );
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      const newSelectedIds = new Set(selectedIds);
      data.forEach((item) => newSelectedIds.add(item.id));
      setSelectedIds(newSelectedIds);
    }
  };

  const handleItemSelect = (id: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleDelete = async () => {
    const selectedIdsArray = Array.from(selectedIds);
    setIsDeleting(true);
    try {
      const response = await axiosInstance.post("/delete_segregations/", {
        ids: selectedIdsArray,
      });
      if (response.status === 200) {
        setData((prevData) =>
          prevData.filter((annotation) => !selectedIds.has(annotation.id))
        );
        setSelectedIds(new Set());
        alert("Selected files deleted successfully");
      } else {
        throw new Error("Failed to delete selected files");
      }
    } catch (error: any) {
      console.error(
        "Error during deletion:",
        error.response?.data.message || error.message
      );
      alert(
        "Error during deletion: " +
          (error.response?.data.message || error.message)
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto mt-4 overflow-hidden">
      <div className="bg-blue-300 text-black rounded-md p-1 grid grid-cols-3 gap-3 text-xl text-center">
        <div className="flex flex-col items-center">
          <div className="flex mb-1 items-center">
            <h1 className="text-lg font-semibold ">ID</h1>
            <button
              onClick={() => setShowCheckboxes((prev) => !prev)}
              className="bg-blue-500 hover:bg-blue-700 text-white px-2 rounded-xl ml-2 text-sm"
              title="select annotations"
            >
              select
            </button>
          </div>
          <input
            type="text"
            value={serachID || ""}
            onChange={(e) => setSearchID(e.target.value)}
            placeholder="Search by ID"
            className="text-black w-full rounded-md p-2"
          />
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center mb-2">
            <h1 className="text-lg font-semibold">Assignee</h1>
            {userData && userData.is_superuser && (
              <button
                className="bg-white rounded-md ml-2 p-1 shadow hover:shadow-lg transition duration-300"
                onClick={() => setShowDialog(true)}
                title="Smart Assign"
              >
                <img
                  src="assign-user.svg"
                  alt="Smart Assign"
                  className="w-6 h-6"
                />
              </button>
            )}
          </div>
          {userData && userData.is_superuser && (
            <select
              id="user-select"
              className="select-user-dropdown text-black rounded-md p-2"
              onChange={(e) => setSelectedAssignee(e.target.value)}
              value={selectedAssignee ?? ""}
            >
              <option value="all" className="text-gray-400">
                --select--
              </option>

              {/* Check if the group is 'segregators' or 'superusers' */}
              {Object.entries(groupsWithUsers).map(
                ([group, users]) =>
                  (group === "labellers" || group === "superusers") && (
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
          )}
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-semibold mb-3">Status</h1>
          <select
            id="status-select"
            className="select-status-dropdown text-black rounded-md p-2"
            onChange={(e) => setSelectedStatus(e.target.value)}
            value={selectedStatus}
          >
            <option value="all" className="text-gray-400">
              --select--
            </option>
            {uniqueStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {showCheckboxes && (
        <MultiSelect
          handleSelectAll={handleSelectAll}
          handleDelete={handleDelete}
          selectedIds={selectedIds}
          isDeleting={isDeleting}
        ></MultiSelect>
      )}
      <div className="overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
          </div>
        ) : (
          <div className="">
            {data?.map((item: Annotation) => (
              <div
                className="p-4 bg-white border border-blue-300 rounded-md shadow-md hover:shadow-lg transition duration-600 ease-in-out"
                key={item.id}
                onMouseEnter={() => sethoveredRowID(item.id)}
                onMouseLeave={() => sethoveredRowID(null)}
              >
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="flex">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        className="m-2 w-5 h-5"
                        checked={selectedIds.has(item.id)}
                        onChange={() => handleItemSelect(item.id)}
                      />
                    )}
                    <p className="text-sm font-semibold">{item.id}</p>
                  </div>
                  <div className="flex justify-center">
                    {userData && userData.is_superuser ? (
                      <select
                        id="user-select"
                        className="select-user-dropdown text-black rounded-md p-2"
                        onChange={(e) =>
                          handleUserChange(
                            item.id,
                            e.target.value !== "" ? e.target.value : null
                          )
                        }
                        value={item.assigned_to_user ?? ""}
                      >
                        <option value="all" className="text-gray-400">
                          --select--
                        </option>

                        {/* Check if the group is 'segregators' or 'superusers' */}
                        {Object.entries(groupsWithUsers).map(
                          ([group, users]) =>
                            (group === "labellers" ||
                              group === "superusers") && (
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
                      <p className="text-sm font-semibold">
                        {item.assigned_to_user}
                      </p>
                    )}
                  </div>
                  <Link
                    href={{
                      pathname: "/triage_segregation",
                      query: {
                        doc_id: item.id,
                        history: JSON.stringify(item.history),
                        status: item.status,
                        username: userData?.username || "",
                        is_superuser: userData?.is_superuser,
                        invoice_type: item.invoice_type,
                        invoice_subtype: item.invoice_subtype,
                      },
                    }}
                    onClick={() => setTriageReady(true)}
                    onMouseEnter={() => setHoveredLink(true)}
                    onMouseLeave={() => setHoveredLink(false)}
                    className={`text-center rounded-lg p-2 cursor-pointer transition-colors duration-300 ease-in-out w-32 mx-auto 
                      ${
                        item.status === "uploaded"
                          ? "bg-green-200 hover:bg-green-300"
                          : item.status === "segregated"
                          ? "bg-blue-300 hover:bg-blue-400"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                  >
                    {hoveredRowID === item.id && hoveredLink
                      ? "View"
                      : item.status}
                  </Link>
                </div>
                {item.id == hoveredRowID ? (
                  <div className="text-blue-500">
                    {item.history.map((instance: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <p className="text-sm">{instance}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  item.history.length > 0 && (
                    <div className="text-blue-500">
                      <p className="text-sm">
                        {item.history[item.history.length - 1]}
                      </p>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <PageNav
        totalAnnotations={totalAnnotations}
        perPage={perPage}
        currentPage={currentPage}
        changePage={changePage}
      ></PageNav>
      {showDialog && (
        <div className="absolute inset-0 z-20 bg-white bg-opacity-75 flex items-center justify-center">
          <SmartAssign
            handleCloseClick={handleCloseClick}
            handleSmartAssign={handleSmartAssign}
            isUnderSegregation={true}
          />
        </div>
      )}
    </div>
  );
};

export default SubmissionsSeg;
