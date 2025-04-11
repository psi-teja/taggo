import React from 'react';
import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Link from "next/link";
import PageNav from '@/app/utils/PageNav';
import Page from '@/app/page';

interface FileData {
    ID: string;
    "Labelled By": string | null;
    "Reviewed By": string | null;
    Assignee: string | null;
    Status: string;
    "Labelled At": string | null;
    "Reviewed At": string | null;
    History: any[];
}

interface PaginationData {
    page_labelled: number;
    pages_labelled: number;
    total_labelled: number;
    is_last_page_labelled: boolean;

    page_reviewed: number;
    pages_reviewed: number;
    total_reviewed: number;
    is_last_page_reviewed: boolean;
}

interface UserDashboardDataProps {
    username: string | null;
    role: string | null;
}

interface TabProps {
    name: string;
    label: string;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isVisible: boolean;
}

const Tab: React.FC<TabProps> = ({ name, label, activeTab, setActiveTab, isVisible }) => {
    if (!isVisible) return null;

    return (
        <div
            onClick={() => setActiveTab(name)}
            className={`cursor-pointer px-6 py-2 text-lg font-medium ${activeTab === name
                ? "border-b-4 border-blue-500 text-blue-700"
                : "text-gray-500 hover:text-blue-500"}`}
        >
            {label}
        </div>
    );
};

export const UserDashboard: React.FC<UserDashboardDataProps> = ({ username, role }) => {
    const [labelledFiles, setLabelledFiles] = useState<FileData[]>([]);
    const [reviewedFiles, setReviewedFiles] = useState<FileData[]>([]);
    const [paginationData, setPaginationData] = useState<PaginationData>({
        page_labelled: 1,
        pages_labelled: 1,
        total_labelled: 0,
        is_last_page_labelled: false,
        page_reviewed: 1,
        pages_reviewed: 1,
        total_reviewed: 0,
        is_last_page_reviewed: false,
    });

    const [activeTab, setActiveTab] = useState('labelled');

    const date = new Date();
    const offset = date.getTimezoneOffset() == 0 ? 0 : -1 * date.getTimezoneOffset();

    let normalized = new Date(date.getTime() + (offset) * 60000);
    let endDateObj = new Date(normalized.toLocaleString("en-US", { timeZone: "Asia/Calcutta" }));
    let startDateObj = new Date(endDateObj);
    startDateObj.setDate(endDateObj.getDate() - 1)

    const [startDate, setStartDate] = useState<Date | null>(startDateObj);
    const [endDate, setEndDate] = useState<Date | null>(endDateObj);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const perPage = 20;


    const validateDates = (start: Date | null, end: Date | null): boolean => {
        if (!start || !end) return false;
        if (start > end) {
            setErrorMessage("Start date cannot be later than the end date.");
            return false;
        }
        setErrorMessage(null);
        return true;
    };

    const fetchAnnotations = async (startDate: Date | null, endDate: Date | null, pageLabelled: number, pageReviewed: number, username?: string) => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/dashboard_view/`, {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    page_labelled: pageLabelled,
                    page_reviewed: pageReviewed,
                    username: username || undefined,
                    perPage: perPage,
                },
            });
            setLabelledFiles(response.data.labelled_files);
            setReviewedFiles(response.data.reviewed_files);
            setPaginationData(response.data);
        } catch (error) {
            console.error('Error fetching annotations', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (username && validateDates(startDate, endDate)) {
            fetchAnnotations(startDate, endDate, 1, 1, username);
        }
    }, [username, startDate, endDate]);

    const handleStartDateChange = (date: Date | null) => {
        if (date && validateDates(date, endDate)) {
            setStartDate(date);
        }
    };

    const handleEndDateChange = (date: Date | null) => {
        if (date && validateDates(startDate, date)) {
            setEndDate(date);
        }
    };

    const handlePrevious = () => {
        if (username) {
            if (activeTab === 'labelled') {
                fetchAnnotations(
                    startDate,
                    endDate,
                    paginationData.page_labelled - 1,
                    paginationData.page_reviewed,
                    username
                );
            } else if (activeTab === 'reviewed') {
                fetchAnnotations(
                    startDate,
                    endDate,
                    paginationData.page_labelled,
                    paginationData.page_reviewed - 1,
                    username
                );
            }
        }
    };

    const handleNext = () => {
        if (username) {
            if (activeTab === 'labelled') {
                fetchAnnotations(
                    startDate,
                    endDate,
                    paginationData.page_labelled + 1,
                    paginationData.page_reviewed,
                    username
                );
            } else if (activeTab === 'reviewed') {
                fetchAnnotations(
                    startDate,
                    endDate,
                    paginationData.page_labelled,
                    paginationData.page_reviewed + 1,
                    username
                );
            }
        }
    };

    const changePage = (page: number) => {
        if (page > paginationData.page_labelled) {
            handleNext();
        }
        if (page < paginationData.page_labelled) {
            handlePrevious();
        }
    };

    return (
        <>
            {username ?
                (
                    <div className="container mx-auto p-4 bg-gray-100 p-1 shadow-lg">
                        <h1 className="text-2xl text-gray-800 text-center mb-6">
                            {username}'s Annotation Data
                        </h1>

                        <div className="flex justify-between items-center mb-6">
                            <div className="tabs-container border-b border-gray-300">
                                <div className="tabs flex">
                                    <Tab
                                        name="labelled"
                                        label="Labelled Files"
                                        activeTab={activeTab}
                                        setActiveTab={setActiveTab}
                                        isVisible={(role === 'labellers') ||
                                            (role === "superusers") || false}
                                    />
                                    <Tab
                                        name="reviewed"
                                        label="Reviewed Files"
                                        activeTab={activeTab}
                                        setActiveTab={setActiveTab}
                                        isVisible={(role==='reviewers') ||
                                            (role === "superusers") || false}
                                    />
                                </div>
                            </div>

                            <div className="filters flex space-x-6">
                                <div>
                                    <label htmlFor="startDate" className="mr-2 font-medium">Start Date:</label>
                                    <DatePicker
                                        selected={startDate}
                                        onChange={handleStartDateChange}
                                        dateFormat="MMM d, yyyy"
                                        className="px-3 py-2 border border-gray-300 rounded bg-white"
                                        placeholderText="StartDate"
                                    />

                                </div>
                                <div>
                                    <label htmlFor="endDate" className="mr-2 font-medium">End Date:</label>
                                    <DatePicker
                                        selected={endDate}
                                        onChange={handleEndDateChange}
                                        dateFormat="MMM d, yyyy"
                                        className="px-3 py-2 border border-gray-300 rounded bg-white"
                                        placeholderText="EndDate"
                                    />
                                </div>
                            </div>
                        </div>

                        {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}

                        {loading ? (
                            <p className="text-center">Loading...</p>
                        ) : activeTab === 'labelled' ? (
                            <div className="tab-content">
                                {labelledFiles.length > 0 ? (
                                    <table className="table-auto w-full mb-6 border-collapse border border-gray-300 bg-white">
                                        <thead className="bg-blue-200">
                                            <tr>
                                                <th className="px-4 py-2 border-b text-center">ID</th>
                                                <th className="px-4 py-2 border-b text-center">Reviewed By</th>
                                                <th className="px-4 py-2 border-b text-center">Labelled At</th>
                                                <th className="px-4 py-2 border-b text-center">Assignee</th>
                                                <th className="px-4 py-2 border-b text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {labelledFiles.map((file) => (
                                                <tr key={file.ID} className="hover:bg-blue-100">
                                                    <Link
                                                        href={{
                                                            pathname: "/triage",
                                                            query: {
                                                                doc_id: file.ID,
                                                                history: JSON.stringify(file.History),
                                                                status: file.Status,
                                                                username: username || '',
                                                                edit: false
                                                            },
                                                        }}>
                                                        <td className="px-4 py-2 border-b text-center">{file.ID}</td>
                                                    </Link>
                                                    <td className="px-4 py-2 border-b text-center">{file['Reviewed By']}</td>
                                                    <td className="px-4 py-2 border-b text-center">{file['Labelled At']}</td>
                                                    <td className="px-4 py-2 border-b text-center">{file['Assignee']}</td>
                                                    <td className="px-4 py-2 border-b text-center">{file.Status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-center">No labelled files available for the selected date range.</p>
                                )}
                            </div>
                        ) : (
                            <div className="tab-content">
                                {reviewedFiles.length > 0 ? (
                                    <table className="table-auto w-full mb-6 border-collapse border border-gray-300 bg-white">
                                        <thead className="bg-blue-200">
                                            <tr>
                                                <th className="px-4 py-2 border-b text-center">ID</th>
                                                <th className="px-4 py-2 border-b text-center">Labelled By</th>
                                                <th className="px-4 py-2 border-b text-center">Reviewed At</th>
                                                <th className="px-4 py-2 border-b text-center">Assignee</th>
                                                <th className="px-4 py-2 border-b text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reviewedFiles.map((file) => (
                                                <tr key={file.ID} className="hover:bg-gray-100">
                                                    <Link
                                                        href={{
                                                            pathname: "/triage",
                                                            query: {
                                                                doc_id: file.ID,
                                                                history: JSON.stringify(file.History),
                                                                status: file.Status,
                                                                username: username || '',
                                                                edit: false
                                                            },
                                                        }}>
                                                        <td className="px-4 py-2 border-b text-center">{file.ID}</td>
                                                    </Link>
                                                    <td className="px-4 py-2 border-b text-center">{file['Labelled By']}</td>
                                                    <td className="px-4 py-2 border-b text-center">{file['Reviewed At']}</td>
                                                    <td className="px-4 py-2 border-b text-center">{file['Assignee']}</td>
                                                    <td className="px-4 py-2 border-b text-center">{file.Status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-center">No reviewed files available for the selected date range.</p>
                                )}
                            </div>
                        )}

                       
                        <PageNav 
                            totalAnnotations={activeTab === 'labelled' ? paginationData.total_labelled : paginationData.total_reviewed}
                            perPage={perPage}
                            currentPage={activeTab === 'labelled' ? paginationData.page_labelled : paginationData.page_reviewed}
                            changePage={changePage}
                            >

                        </PageNav>
                    </div>

                )
                :
                (
                    <h1 className="text-2xl text-gray-800 text-center mb-6">
                        No User Found
                    </h1>
                )
            }
        </>
    );
};