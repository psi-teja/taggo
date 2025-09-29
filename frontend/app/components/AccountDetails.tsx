import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from "next/link";

interface AccountDetailsProps {
    loggedInUser: any;
}

const AccountMenu: React.FC<{ loggedInUser: AccountDetailsProps['loggedInUser'], dashboardLoading: boolean, settingsLoading: boolean, changePasswordLoading: boolean, onDashboardClick: () => void, onSettingsClick: () => void, onChangePasswordClick: () => void }> = ({ loggedInUser, dashboardLoading, settingsLoading, changePasswordLoading, onDashboardClick, onSettingsClick, onChangePasswordClick }) => {
    const [logingout, setLogingout] = useState<boolean>(false);

    const handleLogout = useCallback((): void => {
        setLogingout(true);
        localStorage.removeItem('access_token');
        window.location.href = '/login';
    }, []);

    const baseItem = "group w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-teal-50 dark:focus:ring-offset-slate-800";
    const linkItem = `${baseItem} text-teal-700 dark:text-teal-300 bg-teal-50/70 hover:bg-teal-100 dark:bg-teal-600/20 dark:hover:bg-teal-600/30`;
    const loader = (extra?: string) => <div className={`loader border-t-4 border-teal-500 rounded-full w-5 h-5 animate-spin ${extra || ''}`}></div>;

    return (
        <div className="w-64 rounded-xl border border-teal-100/60 dark:border-teal-700/40 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl p-4 ring-1 ring-teal-100/50 dark:ring-teal-700/30 animate-fadeIn">
            <div className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4 text-center truncate" title={loggedInUser?.username}>
                {loggedInUser?.username}
            </div>

            {loggedInUser?.is_superuser && <Link
                href="/settings"
                onClick={onSettingsClick}
                className={linkItem}
            >
                {settingsLoading ? (
                    loader("mx-1")
                ) : (
                    <svg
                        className="w-5 h-5"
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
                    </svg>
                )}
                <span>Settings</span>
            </Link>}
            <Link
                href={{
                    pathname: '/dashboard',
                }}
                onClick={() => {
                    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
                    onDashboardClick();
                }}
                className={linkItem}
            >
                {dashboardLoading ? (
                    loader("mx-1")
                ) : (
                    <svg
                        className="w-5 h-5"
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
                    </svg>
                )}
                <span>Dashboard</span>
            </Link>
            <Link href="/changePassword"
                onClick={onChangePasswordClick}
                className={linkItem}
            >
                {changePasswordLoading ? (
                    loader("mx-1")
                ) : (
                    <svg
                        className="w-5 h-5"
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
                <span>Change Password</span>
            </Link>
            <button
                className={`${baseItem} justify-center bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-500/90 hover:to-red-500/90 focus:ring-rose-400 focus:ring-offset-rose-50 dark:focus:ring-offset-slate-800 shadow`}
                onClick={handleLogout}
            >
                {logingout ? (
                    loader("mx-1 border-white")
                ) : (
                    <svg
                        className="w-5 h-5"
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
                <span>Logout</span>
            </button>
        </div>
    )
};

const AccountDetails: React.FC<AccountDetailsProps> = ({ loggedInUser }) => {
    const [showAccountMenu, setShowAccountMenu] = useState<boolean>(false);
    const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
    const [changePasswordLoading, setChangePasswordLoading] = useState<boolean>(false);
    const [settingsLoading, setSettingsLoading] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => { setMounted(true); }, []);

    const updatePosition = useCallback(() => {
        if (avatarRef.current) {
            const rect = avatarRef.current.getBoundingClientRect();
            setMenuPos({ top: rect.bottom + 12, left: rect.right - 256 }); // 256px = w-64
        }
    }, []);

    useEffect(() => {
        if (showAccountMenu) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [showAccountMenu, updatePosition]);

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

    if (!loggedInUser) {
        return (
            <div className="flex items-center justify-center h-16">
                <div className="loader border-t-4 border-teal-500 rounded-full w-8 h-8 animate-spin"></div>
            </div>
        );
    }

    return (
        <div
            className="ml-4 font-semibold text-slate-800 dark:text-slate-100 flex items-center relative"
            title={loggedInUser.username ? `Logged in as ${loggedInUser.username}` : 'Welcome!'}
            aria-label={loggedInUser.username ? `Logged in as ${loggedInUser.username}` : 'Welcome!'}
        >
            {loggedInUser.username ? (
                <div
                    ref={avatarRef}
                    className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow hover:shadow-md transition active:scale-95 ring-2 ring-transparent focus:outline-none focus:ring-teal-400"
                    onClick={() => setShowAccountMenu(v => !v)}
                    aria-expanded={showAccountMenu}
                    aria-controls="logout-menu"
                >
                    {loggedInUser.username.charAt(0).toUpperCase()}
                </div>
            ) : null}

            {mounted && showAccountMenu && menuPos && createPortal(
                <div
                    id="logout-menu"
                    ref={menuRef}
                    style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 99999 }}
                    className="drop-shadow-2xl"
                >
                    <AccountMenu
                        loggedInUser={loggedInUser}
                        dashboardLoading={dashboardLoading}
                        settingsLoading={settingsLoading}
                        changePasswordLoading={changePasswordLoading}
                        onDashboardClick={handleDashboardClick}
                        onSettingsClick={handleSettingsClick}
                        onChangePasswordClick={handleChangePasswordClick}
                    />
                </div>, document.body)
            }
        </div>
    );
};

export default AccountDetails;
