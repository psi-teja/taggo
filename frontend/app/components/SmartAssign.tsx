import React, { use } from 'react';
import Select from "react-select";
import { useState, useEffect } from 'react';
import axiosInstance from '../hooks/axiosInstance';

interface SmartAssignProps {
    handleCloseClick: () => void;
    handleSmartAssign: (status: string | null, userGroup: string | null, totalCount: number | null,
        userFileDistribution: { [key: string]: { percentage: number; files: number } | null }) => void;
    isUnderSegregation?: boolean
}

const SmartAssign: React.FC<SmartAssignProps> = ({ handleCloseClick, handleSmartAssign, isUnderSegregation = false }) => {
    // define state variables
    const [status, setStatus] = useState<string | null>(null);
    const [userGroup, setUserGroup] = useState<string | null>(null);

    const [percentage, setPercentage] = useState<number | null>(0);
    const [selectedFileCount, setSelectedFileCount] = useState<number | null>(50);

    const [userFileDistribution, setUserFileDistribution] = useState<{
        [key: string]:
        { percentage: number; files: number }
    }>({});

    const [groupsWithUsers, setGroupsWithUsers] = useState<Record<string, string[]> | null>(null);
    const [countPerStatus, setCountPerStatus] = useState<Record<string, { total_count: number, unassigned_count: number }> | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const distributeFiles = (totalFiles: number, userFileDistribution: { [key: string]: number }) => {
        const users = Object.keys(userFileDistribution);
        let distribution: { [key: string]: number } = {};

        // If there are no users or total files are zero, return empty distribution
        if (users.length === 0 || totalFiles === 0) {
            return distribution;
        }

        let assigned = 0;

        // distribute files based on the percentage provided for each user
        for (let user of users) {
            const percentage = userFileDistribution[user] || 0;
            distribution[user] = Math.floor((percentage / 100) * totalFiles);
            assigned += distribution[user];
        }

        // distribute the remainder (if any)
        let remainder = totalFiles - assigned;
        for (let i = 0; remainder > 0; i = (i + 1) % users.length) {
            const user = users[i];
            distribution[user]++;
            remainder--;
        }
        console.log("Total files", totalFiles);
        console.log("User distribution", userFileDistribution);
        console.log('distribution', distribution)
        return distribution;
    };

    const handleInputChange = (user: string, value: string) => {
        let newPercentage = Math.min(Math.max(Number(value), 0), 100);

        setUserFileDistribution((prevFileDistribution) => {
            let updatedFileDistribution = { ...prevFileDistribution };
            updatedFileDistribution[user].percentage = newPercentage;
            const totalPercentage = Object.values(updatedFileDistribution).reduce(
                (sum, { percentage }) => sum + percentage,
                0
            );

            // if the total percentage exceeds 100
            if (totalPercentage > 100) {
                const excess = totalPercentage - 100;
                const remainingPercentages = Object.keys(updatedFileDistribution).reduce((acc, key) => {
                    if (key !== user) {
                        // Decrease others' percentages proportionally
                        acc[key] = {
                            ...updatedFileDistribution[key],
                            percentage: Math.max(0, updatedFileDistribution[key].percentage -
                                (excess / (Object.keys(updatedFileDistribution).length - 1))),
                        };
                    } else {
                        acc[key] = updatedFileDistribution[key];
                    }
                    return acc;
                }, {} as { [key: string]: { percentage: number; files: number } });

                updatedFileDistribution = remainingPercentages;
            } else if (totalPercentage < 100) {
                // If total percentage is less than 100, distribute the remaining percentage
                const deficit = 100 - totalPercentage;
                const remainingPercentages = Object.keys(updatedFileDistribution).reduce((acc, key) => {
                    if (key !== user) {
                        acc[key] = {
                            ...updatedFileDistribution[key],
                            percentage: Math.min(100, updatedFileDistribution[key].percentage + (deficit / (Object.keys(updatedFileDistribution).length - 1))),
                        };
                    } else {
                        acc[key] = updatedFileDistribution[key];
                    }
                    return acc;
                }, {} as { [key: string]: { percentage: number; files: number } });

                updatedFileDistribution = remainingPercentages;
            }

            if (selectedFileCount && userGroup && groupsWithUsers) {
                const users = groupsWithUsers[userGroup];

                if (users) {
                    const updatedFilesDistribution = distributeFiles(
                        selectedFileCount || 0,
                        users.reduce((acc: { [key: string]: number }, user) => {
                            acc[user] = updatedFileDistribution[user].percentage;
                            return acc;
                        }, {})
                    );

                    console.log("updatedFilesDistribution", updatedFilesDistribution);

                    // Update the files count for each user
                    Object.keys(updatedFileDistribution).forEach((user) => {
                        updatedFileDistribution[user].files = updatedFilesDistribution[user] || 0;
                    });
                } else {
                    console.log("No users found in the selected user group.");
                }
            } else {
                console.log("Percentage count or user group is missing. Files won't be distributed.");
            }

            return updatedFileDistribution;
        });
    };

    useEffect(() => {
        if (!status || !countPerStatus || percentage === null) return;

        const numberOfFiles = calculateNumberOfFiles(status, percentage);
        setSelectedFileCount(numberOfFiles);

        if (userGroup && groupsWithUsers) {
            const users = groupsWithUsers[userGroup] || [];
            const initialPercentages = users.reduce((acc: { [key: string]: number }, user) => {
                acc[user] = 100 / users.length;
                return acc;
            }, {});

            const fileDistribution = distributeFiles(numberOfFiles || 0,
                users.reduce((acc: { [key: string]: number }, user) => {
                    acc[user] = initialPercentages[user];
                    return acc;
                }, {}));

            const updatedFileDistribution = Object.keys(initialPercentages).reduce((acc, user) => {
                acc[user] = {
                    percentage: initialPercentages[user],
                    files: fileDistribution[user] || 0,
                };
                return acc;
            }, {} as { [key: string]: { percentage: number; files: number } });

            setUserFileDistribution(updatedFileDistribution);
        }

    }, [status]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!status || !countPerStatus) return;

        const newPercentage = Number(e.target.value);
        const newPercentageCount = calculateNumberOfFiles(status, newPercentage);
        setPercentage(newPercentage);
        setSelectedFileCount(newPercentageCount);

        //set group distribution
        if (userGroup && groupsWithUsers) {
            const users = groupsWithUsers[userGroup] || [];
            const updatedFileDistribution = distributeFiles(newPercentageCount || 0,
                users.reduce((acc: { [key: string]: number }, user) => {
                    acc[user] = userFileDistribution[user].percentage;
                    return acc;
                }, {}));

            Object.keys(updatedFileDistribution).forEach((user) => {
                userFileDistribution[user].files = updatedFileDistribution[user] || 0;
            });
            setUserFileDistribution(userFileDistribution);
        }
    };

    const handleUserGroupChange = (selectedOption: { value: string; label: string } | null) => {
        setUserGroup(selectedOption?.value || null);
        console.log('selectedOption', selectedOption?.value)

        //set group distribution
        if (selectedOption && groupsWithUsers) {
            const users = groupsWithUsers[selectedOption.value] || [];
            const initialPercentages = users.reduce((acc: { [key: string]: number }, user) => {
                acc[user] = 100 / users.length;
                return acc;
            }, {});

            const fileDistribution = distributeFiles(selectedFileCount || 0,
                users.reduce((acc: { [key: string]: number }, user) => {
                    acc[user] = initialPercentages[user];
                    return acc;
                }, {}));

            const updatedFileDistribution = Object.keys(initialPercentages).reduce((acc, user) => {
                acc[user] = {
                    percentage: initialPercentages[user],
                    files: fileDistribution[user] || 0,
                };
                return acc;
            }, {} as { [key: string]: { percentage: number; files: number } });

            setUserFileDistribution(updatedFileDistribution);
        }
    };

    const calculateNumberOfFiles = (status: string, percentage: number | null) => {
        if (!status || !countPerStatus ||
            !countPerStatus[status] || percentage === null)
            return 0;

        const numberOfFiles = Math.floor((percentage / 100) *
            countPerStatus[status].unassigned_count);
        return numberOfFiles;
    };

    useEffect(() => {
        const fetchData = async () => {
            const response = await axiosInstance.get(isUnderSegregation?'/get_smart_assign_data_seg':'/get_smart_assign_data');
            console.log("response smart assign", response)

            setGroupsWithUsers(response.data.groups);
            setCountPerStatus(response.data.status);
            setLoading(false);
        };
        fetchData();
    }, [])

    if (loading) {
        return <div className="text-center p-6">
            <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
        </div>;
    }

    return (
        <div className="w-full max-w-lg p-8 rounded-lg text-center shadow-lg bg-blue-50 text-blue-900 border border-blue-200 relative">
            <button
                className="absolute top-2 right-2 text-blue-500 hover:text-blue-700"
                onClick={() => handleCloseClick()}
            >
                &times;
            </button>
            <h2 className="text-3xl font-semibold mb-6">Smart Assign</h2>
            <div className="flex flex-col text-left mb-4">
                <h3 className="font-semibold text-xl mb-2">Status:</h3>
                <Select
                    placeholder="Select status"
                    options={countPerStatus ? Object.keys(countPerStatus).map((status) => ({
                        value: status,
                        label: `${status} (${countPerStatus[status].unassigned_count} unassigned)`
                    })) : []}
                    onChange={(selectedOption) => setStatus(selectedOption?.value || null)}
                    className="w-full"
                />
            </div>
            {status && countPerStatus && (
                <>
                    <div className="flex justify-between items-center">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={percentage ?? 0}
                            onChange={handleSliderChange}
                            className="w-full h-2 bg-blue-200 accent-blue-500 focus:outline-none"
                        />
                        <span className="ml-4 font-bold">{percentage}%</span>
                    </div>
                    <p className="text-left mb-4 text-gray-700">
                        Assigning {selectedFileCount} invoices.
                    </p>
                </>
            )}

            <div className="flex flex-col text-left mb-4">
                <h3 className="font-semibold text-xl mb-2">User Group:</h3>
                <Select
                    placeholder="Select user group"
                    options={groupsWithUsers ? Object.keys(groupsWithUsers).map((group) => ({ value: group, label: group })) : []}
                    onChange={handleUserGroupChange}
                    className="w-full"
                />
            </div>
            <div className="mb-6 text-left">
                {userGroup && groupsWithUsers && groupsWithUsers?.[userGroup]?.length > 0 && (
                    <>
                        <h3 className="font-semibold mb-4 text-lg">Users in {userGroup}:</h3>
                        <ul>
                            {groupsWithUsers[userGroup]?.map((user) => (
                                <li
                                    key={user}
                                    className="flex justify-between items-center bg-blue-50 rounded-lg shadow-sm hover:bg-blue-100 p-2 mb-2"
                                >
                                    <div className="flex items-center space-x-4 w-3/4">
                                        <span className="font-semibold text-sm">{user}</span>
                                        <div className="relative w-full">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={userFileDistribution[user]?.percentage || 0}
                                                onChange={(e) => handleInputChange(user, e.target.value)}
                                                className="w-full p-1 rounded-lg border border-blue-300 focus:outline-none pr-10"
                                            />
                                            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                                        </div>
                                    </div>
                                    {status && selectedFileCount !== 0 && userFileDistribution && (
                                        <span className="ml-4 text-sm">
                                            {userFileDistribution[user].files} invoices
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <button
                onClick={() => handleSmartAssign(status, userGroup, selectedFileCount, userFileDistribution)}
                className={`px-6 py-3 rounded-lg transition duration-300 ${!status || !userGroup || !percentage ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                disabled={!status || !userGroup || !percentage}
            >
                Assign
            </button>
        </div>
    )
}

export default SmartAssign;
