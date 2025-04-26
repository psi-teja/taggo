"use client";

import { useEffect, useState } from "react";
import { FC } from "react";

interface WithAuthProps {
  [key: string]: any;
}

const withAuth = (WrappedComponent: FC<WithAuthProps>): FC<WithAuthProps> => {
  const AuthenticatedComponent: FC<WithAuthProps> = (props) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
      const token = localStorage.getItem("access_token");
      if (token) {
        setIsAuthenticated(true);
      } else {
        window.location.href = "/login";
      }
    }, []);

    if (isAuthenticated === null) {
      // Still checking auth - you can show a loading spinner if you want
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-gray-600 text-xl animate-pulse">Checking authentication...</div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  return AuthenticatedComponent;
};

export default withAuth;
