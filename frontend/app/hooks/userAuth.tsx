import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setLoggedInUser(parsedUser);
    } else {
      console.log("No user data found in local storage.");
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }, []);

  return { loggedInUser };
};
