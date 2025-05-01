"use client";
import React, { useState, useEffect } from "react";
import Tile from "./components/Tile";
import { UserDashboard } from "./components/UserAnnotationsData";
import Link from "next/link";
import { HiHome } from "react-icons/hi";
import SelectUser from "./components/SelectUser";
import Header from "../utils/Header";

interface UserData {
  is_superuser: boolean;
  username: string;
  groups: string[];
}

interface UserSelection {
  username: string;
  group: string;
}

const Dashboard: React.FC = () => {
  const [homeReady, setHomeReady] = useState<boolean>(false);
  const [selectedUserAndGroup, setSelectedUserAndGroup] = useState({
    username: "",
    group: "",
  });
  const [loggedInUser, setLoggedInUser] = useState<UserData | null>(null);

  useEffect(() => {
    const storedUserData = localStorage.getItem("loggedInUser");

    if (storedUserData) {
      const parsedUserData: UserData = JSON.parse(storedUserData);
      setLoggedInUser(parsedUserData);
    }
  }, []);

  if (homeReady) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
      </div>
    );
  }

  const handleUserChange = (selection: UserSelection | null) => {
    if (selection === null) {
      setSelectedUserAndGroup({ username: "", group: "" });
    } else {
      setSelectedUserAndGroup(selection);
    }
  };

  return (
    <div className="">
      <Header>
        {" "}
        <Link
          href="/labelling"
          className="text-teal-900 hover:underline flex items-center"
          onClick={() => setHomeReady(true)}
        >
          <HiHome className="m-1 text-2xl" />
          <p className="m-1 text-lg font-semibold">Home</p>
        </Link>
        <div className="flex items-center text-2xl font-bold text-gray-800">
          <svg
            className="w-6 h-6 mr-2"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12h18M3 6h18M3 18h18"
            />
          </svg>
          <span>Dashboard</span>
        </div>
      </Header>
      <main className="mt-4">
        {loggedInUser?.is_superuser ? (
          <>
            <Tile />
            <div className="mt-4">
              <SelectUser handleUserChange={handleUserChange} />
            </div>
            <div className="mt-4">
              <UserDashboard
                username={selectedUserAndGroup.username}
                role={selectedUserAndGroup.group}
              />
            </div>
          </>
        ) : (
          <div className="mt-4">
            <UserDashboard
              username={loggedInUser?.username ?? null}
              role={loggedInUser?.groups[0] ?? null}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
