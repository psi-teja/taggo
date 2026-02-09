export type User = {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_superuser: boolean;
    
    is_active: boolean;
    is_staff: boolean;
    date_joined: string;
};

export default User;