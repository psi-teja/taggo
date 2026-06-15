"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getAccessToken, getLoggedInUser } from "./hooks/authStorage";
import { Loader2 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        async function bootstrap() {
            // First check if any superuser exists — if not, must set one up first
            try {
                const res = await axios.get(`${API_BASE_URL}/check-superuser/`);
                if (!res.data?.superuser_exists) {
                    router.replace("/create-superuser");
                    return;
                }
            } catch {
                // Backend unreachable — fall through to login
            }

            // Superuser exists: if already authenticated go to dashboard, else login
            const token = getAccessToken();
            const user = getLoggedInUser();
            if (token && user) {
                router.replace("/dashboard");
            } else {
                router.replace("/login");
            }
        }

        bootstrap();
    }, [router]);

    return (
        <div className="h-screen w-full flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-teal-500" size={32} />
        </div>
    );
}
