"use client"
import { useEffect } from 'react';
import { FC } from 'react';

interface WithAuthProps {
    [key: string]: any;
}

const withAuth = (WrappedComponent: FC<WithAuthProps>): FC<WithAuthProps> => {
    return (props: WithAuthProps) => {
        useEffect(() => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                window.location.href = '/login';
            }
        }, []);

        return <WrappedComponent {...props} />;
    };
};

export default withAuth;
