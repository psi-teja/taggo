import Link from "next/link";
import Image from "next/image";

const TallyLogo = () => {
    return (
        <div className="flex items-center space-x-2">
            <Link href="/">
                <Image
                    src={"/Tally-Logo.webp"}
                    alt="Image"
                    width={60}
                    height={60}
                    className=""
                />
            </Link>
        </div>
    );
};

export default TallyLogo;
