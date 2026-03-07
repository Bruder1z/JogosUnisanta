import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, mockUsers } from '../data/mockData';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: Omit<User, 'id' | 'role'>) => Promise<boolean>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => Promise<boolean>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('jogos_unisanta_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Check local storage for registered users first
                const registeredUsersRaw = localStorage.getItem('jogos_unisanta_registered_users');
                const registeredUsers: User[] = registeredUsersRaw ? JSON.parse(registeredUsersRaw) : [];

                const allUsers = [...mockUsers, ...registeredUsers];
                const foundUser = allUsers.find(u => u.email === email && password === '@123123');

                if (foundUser) {
                    setUser(foundUser);
                    localStorage.setItem('jogos_unisanta_user', JSON.stringify(foundUser));
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 500);
        });
    };

    const register = async (userData: Omit<User, 'id' | 'role'>): Promise<boolean> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const registeredUsersRaw = localStorage.getItem('jogos_unisanta_registered_users');
                const registeredUsers: User[] = registeredUsersRaw ? JSON.parse(registeredUsersRaw) : [];

                const newUser: User = {
                    ...userData,
                    id: Math.random().toString(36).substr(2, 9),
                    role: 'cliente'
                };

                const updatedUsers = [...registeredUsers, newUser];
                localStorage.setItem('jogos_unisanta_registered_users', JSON.stringify(updatedUsers));

                setUser(newUser);
                localStorage.setItem('jogos_unisanta_user', JSON.stringify(newUser));
                resolve(true);
            }, 500);
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('jogos_unisanta_user');
    };

    const updateUser = async (updates: Partial<User>): Promise<boolean> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (!user) return resolve(false);

                const updatedUser = { ...user, ...updates };
                setUser(updatedUser);
                localStorage.setItem('jogos_unisanta_user', JSON.stringify(updatedUser));

                // Also update in registered users list if exists
                const registeredUsersRaw = localStorage.getItem('jogos_unisanta_registered_users');
                if (registeredUsersRaw) {
                    const registeredUsers: User[] = JSON.parse(registeredUsersRaw);
                    const updatedList = registeredUsers.map(u => u.id === user.id ? updatedUser : u);
                    localStorage.setItem('jogos_unisanta_registered_users', JSON.stringify(updatedList));
                }

                resolve(true);
            }, 300);
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
