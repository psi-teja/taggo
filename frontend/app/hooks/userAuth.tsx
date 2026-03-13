import { useEffect, useState } from "react";
import { User } from "@/app/components/User";
import { getLoggedInUser } from "./authStorage";

export const useAuth = () => {
  const [loggedInUser, setLoggedInUser] = useState<User | undefined>();

  useEffect(() => {
    const storedUser = getLoggedInUser();
    if (storedUser) {
      setLoggedInUser(storedUser);
    } else {
      window.location.href = "/login";
    }
  }, []);

  return { loggedInUser };
};

export const useAuthWithoutRedirect = () => {
  const [loggedInUser, setLoggedInUser] = useState<User | undefined>();

  useEffect(() => {
    const storedUser = getLoggedInUser();
    if (storedUser) {
      setLoggedInUser(storedUser);
    }
  }, []);

  return { loggedInUser };
};
