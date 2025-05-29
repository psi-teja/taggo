"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Tasks from "@/app/components/Tasks";
import AppHeader from "@/app/components/AppHeader";
import { useAuth } from "../hooks/userAuth";

const InvoiceParsing = () => {

  const { loggedInUser } = useAuth();

  return (
    <div className="flex flex-col h-screen">
      <AppHeader loggedInUser={loggedInUser} task_type={'object-detection'} />
      <Tasks task_type={'object-detection'}loggedInUser={loggedInUser}/>
    </div>
  );
};

export default InvoiceParsing;