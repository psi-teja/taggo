import Link from "next/link";
import Image from "next/image";

const Logo = () => {
    return (
        <div className="flex items-center space-x-2">
            <Link href="/">
                <div className="flex justify-between p-2">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="h-10 animate-fadeIn"
                    />
                </div>
            </Link>
        </div>
    );
};

export default Logo;
