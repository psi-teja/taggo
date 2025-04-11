import { useState, useCallback, useEffect, useRef } from 'react';
import Link from "next/link";

interface AccountDetailsProps {
    userData: {
        username: string;
        email: string;
        is_superuser: boolean;
        groups: string[];
    };
}

const AccountMenu: React.FC<{ userData: AccountDetailsProps['userData'], dashboardLoading: boolean, settingsLoading: boolean, changePasswordLoading: boolean, onDashboardClick: () => void, onSettingsClick: () => void, onChangePasswordClick: () => void }> = ({ userData, dashboardLoading, settingsLoading, changePasswordLoading, onDashboardClick, onSettingsClick, onChangePasswordClick }) => {
    const [logingout, setLogingout] = useState<boolean>(false);

    const handleLogout = useCallback((): void => {
        setLogingout(true);
        localStorage.removeItem('access_token');
        window.location.href = '/login';
    }, []);

    return (
        <div className="absolute top-full mt-2 right-0 bg-blue-100 border border-blue-300 rounded-lg shadow-lg p-4 w-60 z-40">
            <div className="text-xl font-semibold text-blue-900 mb-4 text-center truncate" title={userData.username}>
                {userData.username}
            </div>

            {userData.is_superuser && <Link
                href="/settings"
                onClick={onSettingsClick}
                className="block text-lg font-semibold text-blue-600 hover:text-blue-800 transition duration-150 mb-4 text-center flex items-center justify-center"
            >
                {settingsLoading ? (
                    <div className="loader border-t-4 border-blue-500 rounded-full w-6 h-6 mx-2 animate-spin"></div>
                ) :
                    <svg
                        className="w-6 h-6 mr-2"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7.75 4H19M7.75 4a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 4h2.25m13.5 6H19m-2.25 0a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 10h11.25m-4.5 6H19M7.75 16a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 16h2.25"
                        />
                    </svg>}
                Settings

            </Link>}
            <Link
                href={{
                    pathname: '/dashboard',
                }}
                onClick={() => {
                    localStorage.setItem('userData', JSON.stringify(userData));
                    onDashboardClick();
                }}
                className="block text-lg font-semibold text-blue-600 hover:text-blue-800 transition duration-150 mb-4 text-center flex items-center justify-center"
            >
                {dashboardLoading ? (
                    <div className="loader border-t-4 m-1 border-blue-500 rounded-full w-6 h-6 mx-2 animate-spin"></div>
                ) :
                    <svg
                        className="w-6 h-6 mr-2"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 12h18M3 6h18M3 18h18"
                        />
                    </svg>}
                Dashboard

            </Link>
            <Link href="/changePassword"
                onClick={onChangePasswordClick}
                className="block text-lg font-semibold text-blue-600 hover:text-blue-800 transition duration-150 mb-4 text-center flex items-center justify-center"
            >
                {changePasswordLoading ? (
                    <div className="loader border-t-4 border-blue-500 rounded-full w-6 h-6 mx-2 animate-spin"></div>
                ) : (
                    <svg
                        className="w-6 h-6 mr-2"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0 0v2m0 4v2m-4-2h8"
                        />
                    </svg>
                )}
                Change Password
            </Link>
            <button
                className="w-full bg-red-500 text-white py-3 rounded-md hover:bg-red-600 focus:ring-2 focus:ring-red-400 transition duration-150 flex items-center justify-center"
                onClick={handleLogout}
            >
                {logingout ? (
                    <div className="loader border-t-4 border-white rounded-full w-6 h-6 mx-2 animate-spin"></div>
                ) : (
                    <svg
                        className="w-6 h-6 mr-2"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"
                        />
                    </svg>
                )}
                Logout
            </button>
        </div>
    )
};

const AccountDetails: React.FC<AccountDetailsProps> = ({ userData }) => {
    const [showAccountMenu, setShowAccountMenu] = useState<boolean>(false);
    const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
    const [changePasswordLoading, setChangePasswordLoading] = useState<boolean>(false);
    const [settingsLoading, setSettingsLoading] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowAccountMenu(false);
        }
    }, []);

    useEffect(() => {
        if (showAccountMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAccountMenu, handleClickOutside]);

    const handleDashboardClick = () => {
        setDashboardLoading(true);
    }

    const handleSettingsClick = () => {
        setSettingsLoading(true);
    }

    const handleChangePasswordClick = () => {
        setChangePasswordLoading(true);
    }

    return (
        <div
            className="ml-4 font-semibold text-blue-900 flex items-center relative"
            title={userData.username ? `Logged in as ${userData.username}` : 'Welcome!'}
            aria-label={userData.username ? `Logged in as ${userData.username}` : 'Welcome!'}
        >
            {userData.username ? (
                <div
                    className="w-10 h-10 flex items-center justify-center bg-blue-900 text-white rounded-full cursor-pointer hover:bg-blue-800 transition duration-150"
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    aria-expanded={showAccountMenu}
                    aria-controls="logout-menu"
                >
                    {userData.username.charAt(0).toUpperCase()}
                </div>
            ) : (
                null
            )}

            {showAccountMenu && (
                <div 
                onMouseLeave={() => setShowAccountMenu(false)}
                ref={menuRef} id="logout-menu">
                    <AccountMenu userData={userData} dashboardLoading={dashboardLoading} settingsLoading={settingsLoading} changePasswordLoading={changePasswordLoading} onDashboardClick={handleDashboardClick} onSettingsClick={handleSettingsClick} onChangePasswordClick={handleChangePasswordClick} />
                </div>
            )}
        </div>
    );
};

export default AccountDetails;
