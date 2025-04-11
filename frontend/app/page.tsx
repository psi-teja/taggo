"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import withAuth from "@/app/utils/withAuth";
import Header from "./utils/Header";
import AccountDetails from "./utils/AccountDetails";
import axiosInstance from "./utils/axiosInstance";
import TallyLogo from "./utils/TallyLogo";

interface UserData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  is_superuser: boolean;
  groups: string[];
}

const Home = () => {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await axiosInstance.get("/get_user_data");
      setUserData(response.data);
    };
    fetchData();
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header>
      <TallyLogo />
      <h1 className="text-xl font-bold text-teal-900 sm:p-0 md:p-1 lg:p-2 xl:p-3">
        Taggo
      </h1>
      {userData ? (
        <AccountDetails userData={userData} />
      ) : (
        <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
      )}
      </Header>
      <main className="flex-grow flex justify-center items-center bg-gray-50 space-x-12 p-4">
      {/* Labelling Task Card */}
      <div
        className="p-8 md:p-16 border border-blue-200 rounded-3xl shadow-2xl bg-gradient-to-br from-red-200 to-purple-200 w-full max-w-md h-[400px] cursor-pointer transform transition-transform duration-300 hover:scale-105 hover:shadow-3xl"
        onClick={() => {
        window.location.href = "/labelling";
        }}
      >
        <h1 className="text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
        Labelling
        </h1>
        <div className="flex justify-center mt-20">
        <Image
          src={"/rect.png"}
          alt="Labelling"
          width={100}
          height={100}
          className="rounded-lg"
        />
        </div>
      </div>

      {/* Segregation Task Card */}
      <div
        className="p-8 md:p-16 border border-blue-200 rounded-3xl shadow-2xl bg-gradient-to-br from-green-100 to-yellow-100 w-full max-w-md h-[400px] cursor-pointer transform transition-transform duration-300 hover:scale-105 hover:shadow-3xl"
        onClick={() => {
        window.location.href = "/segregation";
        }}
      >
        <h1 className="text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-yellow-600">
        Segregation
        </h1>
        <div className="flex justify-center mt-20">
        <Image
          src={"/download-removebg-preview.png"}
          alt="Segregation"
          width={150}
          height={150}
          className="rounded-lg"
        />
        </div>
      </div>
      </main>
    </div>
  );
};

export default withAuth(Home);
