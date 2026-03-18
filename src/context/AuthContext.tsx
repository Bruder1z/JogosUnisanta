import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User } from '../data/mockData';
import { supabase } from '../services/supabaseClient';
import bcrypt from 'bcryptjs';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: RegisterUser) => Promise<boolean>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => Promise<boolean>;
    isLoading: boolean;
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
}

export type RegisterUser = Omit<User, 'id' | 'role'> & { password: string };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('jogos_unisanta_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        // Busca usuário no banco
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error || !data) return false;
        // Compara senha usando bcrypt
        if (!data.password) return false;
        const isValid = await bcrypt.compare(password, data.password);
        if (isValid) {
            setUser(data);
            localStorage.setItem('jogos_unisanta_user', JSON.stringify(data));
            return true;
        }
        return false;
    };

    const register = async (userData: RegisterUser): Promise<boolean> => {
        // Gera hash da senha
        const hash = await bcrypt.hash(userData.password, 10);
        const { data, error } = await supabase.from('users').insert([
            {
                email: userData.email,
                name: userData.name,
                surname: userData.surname,
                preferredcourse: userData.preferredCourse,
                favoriteteam: userData.favoriteTeam,
                password: hash,
                role: 'cliente',
            },
        ]).select('*').single();
        if (error || !data) return false;
        setUser(data);
        localStorage.setItem('jogos_unisanta_user', JSON.stringify(data));
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('jogos_unisanta_user');
    };

    const updateUser = async (updates: Partial<User>): Promise<boolean> => {
        if (!user) return false;
        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('email', user.email);
        if (!error) {
            setUser({ ...user, ...updates });
            return true;
        }
        return false;
    };

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    return (
        <AuthContext.Provider value={{
            user, login, register, logout, updateUser, isLoading,
            isLoginModalOpen, openLoginModal, closeLoginModal
        }}>
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
