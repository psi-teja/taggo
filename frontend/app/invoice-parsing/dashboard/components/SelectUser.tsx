import React from 'react';
import axiosInstance from '@/app/hooks/axiosInstance';
import { useEffect, useState } from 'react';
interface SelectUserProps {
    handleUserChange: (selection: { username: string, group: string }) => void;
}

const SelectUser: React.FC<SelectUserProps> = ({ handleUserChange }) => {
    const [groupsWithUsers, setGroupsWithUsers] = useState<{ [key: string]: string[] }>({});
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    useEffect(() => {
        const fetchGroupsWithUsers = async () => {
            const response = await axiosInstance.get('/get_groups_with_users');
            setGroupsWithUsers(response.data);
        };
        fetchGroupsWithUsers();
    }, []);

    return (
        <div className="select-user-container flex justify-center p-4 ">
            <label htmlFor="user-select" className="select-user-label p-2 border border-gray-300 rounded block">Select a user:</label>
            <select
                id="user-select"
                className="select-user-dropdown"
                onChange={(e) => {
                    const selectedUser = e.target.value;
                    const selectedGroup = Object.keys(groupsWithUsers).find(group =>
                        groupsWithUsers[group].includes(selectedUser)
                    );
                    console.log("Selected user:", selectedUser, "Selected group:", selectedGroup);
                    setSelectedUser(selectedUser);
                    handleUserChange({ username: selectedUser, group: selectedGroup || "" });
                }}
                value={selectedUser ?? ''}
            >
                <option value="" disabled>--Please choose an option--</option>
                {Object.entries(groupsWithUsers).map(([group, users]) => (
                    <optgroup key={group} label={group}>
                        {users.map((user: string) => (
                            <option key={user} value={user}>
                                {user}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
};

export default SelectUser;