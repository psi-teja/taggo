"use client";
import { useEffect, useState } from "react";
import SubmissionsSeg from "./components/SubmissionsSeg";
import HomeHeaderSeg from "./components/HomeHeaderSeg";
import withAuth from "@/app/utils/withAuth";
import axiosInstance from "@/app/utils/axiosInstance";

const Home = () => {
  interface UserData {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    date_joined: string;
    is_superuser: boolean;
    groups: string[];
  }

  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await axiosInstance.get("/get_user_data");
      setUserData(response.data);
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <HomeHeaderSeg userData={userData} />
      <SubmissionsSeg userData={userData} />
    </div>
  );
};

export default withAuth(Home);
