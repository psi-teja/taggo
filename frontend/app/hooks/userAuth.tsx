import { useEffect, useState } from "react";

interface LoggedInUser {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_superuser?: boolean;
  groups?: string[];
}

export const useAuth = () => {
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setLoggedInUser(parsedUser);
    } else {
      setLoggedInUser(null);
    }
  }, []);

  return { loggedInUser };
};
