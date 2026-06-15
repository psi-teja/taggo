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
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
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
