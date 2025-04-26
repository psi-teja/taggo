"use client";
import { useEffect, useState } from "react";
import Tasks from "@/app/components/Tasks";
import HomeHeader from "@/app/components/HomeHeader";
import axiosInstance from "@/app/components/axiosInstance";

const Labelling = () => {
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
      <HomeHeader userData={userData} />
      <Tasks userData={userData} />
    </div>
  );
};

export default Labelling;