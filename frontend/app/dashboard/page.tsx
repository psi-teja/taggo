"use client"
import Header from '../components/Header';
import Logo from '../components/Logo';
import AccountDetails from '../components/AccountDetails';
import { useAuth } from "@/app/hooks/userAuth";

const Dashboard = () => {
    const { loggedInUser } = useAuth();
    
    return (
        <div className="flex flex-col min-h-screen">
            <Header>
                <Logo />
                {loggedInUser && <AccountDetails loggedInUser={loggedInUser} />}
            </Header>
        </div>
    )

}

export default Dashboard;