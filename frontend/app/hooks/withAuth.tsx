"use client";

import { useAuth } from "./userAuth";
import { FC } from "react";
import { Loader2 } from "lucide-react";

export type WithAuthProps = {
  [key: string]: any;
};

const withAuth = (WrappedComponent: FC<WithAuthProps>): FC<WithAuthProps> => {
  const AuthenticatedComponent: FC<WithAuthProps> = (props) => {
    const { loggedInUser } = useAuth();

    if (!loggedInUser) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
          <Loader2 className="animate-spin text-teal-500 mb-3" size={32} />
          <p className="text-sm font-medium text-slate-400">Loading...</p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  return AuthenticatedComponent;
};

export default withAuth;
