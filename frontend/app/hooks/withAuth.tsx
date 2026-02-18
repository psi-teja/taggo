"use client";

import { useAuth } from "./userAuth";
import { FC } from "react";

export type WithAuthProps = {
  [key: string]: any;
};

const withAuth = (WrappedComponent: FC<WithAuthProps>): FC<WithAuthProps> => {
  const AuthenticatedComponent: FC<WithAuthProps> = (props) => {
    const { loggedInUser } = useAuth();

    if (!loggedInUser) {
      // Still checking auth or not authenticated
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
