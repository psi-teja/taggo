import { useEffect, useState } from "react";
import { User } from "@/app/components/User";
import Router from "next/router";

export const useAuth = () => {
  const [loggedInUser, setLoggedInUser] = useState<User | undefined>();

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setLoggedInUser(parsedUser);
    } else {
      window.location.href = "/login";
    }
  }, []);

  return { loggedInUser };
};
