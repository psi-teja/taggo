"use client";
import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from "next/link";
import { 
  Settings, LayoutDashboard, KeyRound, 
  LogOut, User, ChevronDown 
} from "lucide-react";
import { clearAuthStorage } from "@/app/hooks/authStorage";

interface AccountDetailsProps {
    loggedInUser: any;
}

const AccountMenu: React.FC<{ 
    loggedInUser: any;
    dashboardLoading: boolean; 
    settingsLoading: boolean; 
    changePasswordLoading: boolean; 
    onDashboardClick: () => void; 
    onSettingsClick: () => void; 
    onChangePasswordClick: () => void; 
}> = ({ 
    loggedInUser, 
    dashboardLoading, 
    settingsLoading, 
    changePasswordLoading, 
    onDashboardClick, 
    onSettingsClick, 
    onChangePasswordClick 
}) => {
    const [logingout, setLogingout] = useState<boolean>(false);

    const handleLogout = useCallback((): void => {
        setLogingout(true);
        clearAuthStorage();
        window.location.href = '/login';
    }, []);

    const linkItem = "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 text-slate-600 hover:text-teal-600 hover:bg-teal-50/50 active:scale-[0.98]";
    const loader = <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />;

    return (
        <div className="w-64 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
            {/* Header: User Info */}
            <div className="px-3 py-4 mb-1 border-b border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Authenticated As</p>
                <p className="text-sm font-black text-slate-900 truncate">{loggedInUser?.username}</p>
                {loggedInUser?.is_superuser && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-amber-50 text-[10px] font-bold text-amber-600 border border-amber-100">
                        Admin Access
                    </span>
                )}
            </div>

            <div className="space-y-0.5">
                <Link href="/dashboard" onClick={onDashboardClick} className={linkItem}>
                    {dashboardLoading ? loader : <LayoutDashboard size={18} className="text-slate-400 group-hover:text-teal-500" />}
                    <span>Dashboard</span>
                </Link>

                {loggedInUser?.is_superuser && (
                    <Link href="/settings" onClick={onSettingsClick} className={linkItem}>
                        {settingsLoading ? loader : <Settings size={18} className="text-slate-400 group-hover:text-teal-500" />}
                        <span>System Settings</span>
                    </Link>
                )}

                <Link href="/changePassword" onClick={onChangePasswordClick} className={linkItem}>
                    {changePasswordLoading ? loader : <KeyRound size={18} className="text-slate-400 group-hover:text-teal-500" />}
                    <span>Change Password</span>
                </Link>
            </div>

            {/* Logout Section */}
            <div className="mt-2 pt-2 border-t border-slate-100">
                <button
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all active:scale-[0.98]"
                    onClick={handleLogout}
                >
                    {logingout ? <div className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /> : <LogOut size={18} />}
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    )
};

const AccountDetails: React.FC<AccountDetailsProps> = ({ loggedInUser }) => {
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [loadingStates, setLoadingStates] = useState({ dashboard: false, settings: false, password: false });
    const menuRef = useRef<HTMLDivElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => { setMounted(true); }, []);

    const updatePosition = useCallback(() => {
        if (avatarRef.current) {
            const rect = avatarRef.current.getBoundingClientRect();
            setMenuPos({ top: rect.bottom + 12, left: rect.right - 256 });
        }
    }, []);

    useEffect(() => {
        if (showAccountMenu) {
            updatePosition();
            const close = (e: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(e.target as Node) && !avatarRef.current?.contains(e.target as Node)) {
                    setShowAccountMenu(false);
                }
            };
            window.addEventListener('mousedown', close);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('mousedown', close);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [showAccountMenu, updatePosition]);

    if (!loggedInUser) return null;

    return (
        <div className="flex items-center">
            <div
                ref={avatarRef}
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className={`
                    flex items-center gap-2 p-1.5 pr-3 rounded-2xl cursor-pointer transition-all duration-200
                    ${showAccountMenu ? 'bg-slate-100 ring-1 ring-slate-200' : 'hover:bg-slate-50'}
                `}
            >
                {/* Modern Avatar */}
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/10 text-xs font-black">
                    {loggedInUser.username.charAt(0).toUpperCase()}
                </div>
                
                <div className="hidden sm:block">
                    <p className="text-xs font-black text-slate-900 leading-none">{loggedInUser.username}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Member</p>
                </div>

                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showAccountMenu ? 'rotate-180' : ''}`} />
            </div>

            {mounted && showAccountMenu && menuPos && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 99999 }}
                >
                    <AccountMenu
                        loggedInUser={loggedInUser}
                        dashboardLoading={loadingStates.dashboard}
                        settingsLoading={loadingStates.settings}
                        changePasswordLoading={loadingStates.password}
                        onDashboardClick={() => {
                            // Prevent loading state if already on dashboard
                            if (window.location.pathname !== '/dashboard') {
                                setLoadingStates(s => ({ ...s, dashboard: true }));
                            }
                        }}
                        onSettingsClick={() => {
                            // Prevent loading state if already on settings
                            if (window.location.pathname !== '/settings') {
                                setLoadingStates(s => ({ ...s, settings: true }));
                            }
                        }}
                        onChangePasswordClick={() => {
                            // Prevent loading state if already on changePassword
                            if (window.location.pathname !== '/changePassword') {
                                setLoadingStates(s => ({ ...s, password: true }));
                            }
                        }}
                    />
                </div>,document.body)
            }
        </div>
    );
};

export default AccountDetails;