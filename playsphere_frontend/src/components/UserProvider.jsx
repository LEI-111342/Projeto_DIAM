import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const UserContext = createContext(null);
export const useUserContext = () => useContext(UserContext);

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userEmail, setUserEmail] = useState(''); // NOVO
    const [cart, setCart] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8000/core/api/user/', { withCredentials: true })
            .then(response => {
                setUser(response.data.username);
                setUserRole(response.data.role);
                setUserEmail(response.data.email); // NOVO
            })
            .catch(() => {
                setUser(null);
                setUserRole(null);
                setUserEmail('');
            });
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, userRole, setUserRole, userEmail, setUserEmail, cart, setCart }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;