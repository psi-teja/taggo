"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Tasks from "@/app/components/Tasks";
import AppHeader from "@/app/components/AppHeader";

const InvoiceParsing = () => {
  interface UserData {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    date_joined: string;
    is_superuser: boolean;
    groups: string[];
  }

  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);
    } else {
        console.log("No user data found in local storage.");
        const currentPath = window.location.pathname + window.location.search;
        router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
    }
}, []);

  return (
    <div className="flex flex-col h-screen">
      <AppHeader userData={userData} task_type={'invoice-parsing'} />
      <Tasks task_type={'invoice-parsing'}userData={userData}/>
    </div>
  );
};

export default InvoiceParsing;