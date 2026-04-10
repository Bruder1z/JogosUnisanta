import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User } from '../data/mockData';
import { supabase } from '../services/supabaseClient';
import bcrypt from 'bcryptjs';

export interface Prediction {
    matchId: string;
    scoreA: number | '';
    scoreB: number | '';
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: RegisterUser) => Promise<boolean>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => Promise<boolean>;
    userPredictions: Record<string, Prediction>;
    fetchUserPredictions: () => Promise<void>;
    saveUserPredictions: (predictions: Record<string, Prediction>) => Promise<boolean>;
    isLoading: boolean;
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
}

export type RegisterUser = Omit<User, 'id' | 'role'> & { password: string };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userPredictions, setUserPredictions] = useState<Record<string, Prediction>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('jogos_unisanta_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const fetchUserPredictions = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_email', user.email);

        if (!error && data) {
            const preds: Record<string, Prediction> = {};
            data.forEach((p: any) => {
                preds[p.match_id] = {
                    matchId: p.match_id,
                    scoreA: p.score_a,
                    scoreB: p.score_b
                };
            });
            setUserPredictions(preds);
        }
    };

    // Whenever user changes, load predictions
    useEffect(() => {
        if (user) {
            fetchUserPredictions();
        } else {
            setUserPredictions({});
        }
    }, [user?.email]);

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
            const mappedUser = {
                ...data,
                preferredCourse: data.preferredcourse,
                favoriteTeam: data.favoriteteam,
            };
            delete mappedUser.preferredcourse;
            delete mappedUser.favoriteteam;

            setUser(mappedUser);
            localStorage.setItem('jogos_unisanta_user', JSON.stringify(mappedUser));
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

        const mappedUser = {
            ...data,
            preferredCourse: data.preferredcourse,
            favoriteTeam: data.favoriteteam,
        };
        delete mappedUser.preferredcourse;
        delete mappedUser.favoriteteam;

        setUser(mappedUser);
        localStorage.setItem('jogos_unisanta_user', JSON.stringify(mappedUser));
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('jogos_unisanta_user');
    };

    const updateUser = async (updates: Partial<User>): Promise<boolean> => {
        if (!user) return false;

        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.preferredCourse !== undefined) dbUpdates.preferredcourse = updates.preferredCourse;
        if (updates.favoriteTeam !== undefined) dbUpdates.favoriteteam = updates.favoriteTeam;

        const { error } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('email', user.email);
        if (!error) {
            const newUser = { ...user, ...updates };
            setUser(newUser);
            localStorage.setItem('jogos_unisanta_user', JSON.stringify(newUser));
            return true;
        }
        return false;
    };

    const saveUserPredictions = async (predictionsToSave: Record<string, Prediction>): Promise<boolean> => {
        if (!user) return false;

        const rows = Object.values(predictionsToSave).map(p => ({
            user_email: user.email,
            match_id: p.matchId,
            score_a: p.scoreA === '' ? 0 : p.scoreA,
            score_b: p.scoreB === '' ? 0 : p.scoreB
        }));

        if (rows.length === 0) return true;

        const { error } = await supabase
            .from('predictions')
            .upsert(rows, { onConflict: 'user_email,match_id' });

        if (!error) {
            setUserPredictions(prev => ({ ...prev, ...predictionsToSave }));
            return true;
        }
        console.error('Error saving predictions:', error);
        return false;
    };

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    return (
        <AuthContext.Provider value={{
            user, login, register, logout, updateUser, isLoading,
            isLoginModalOpen, openLoginModal, closeLoginModal,
            userPredictions, fetchUserPredictions, saveUserPredictions
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
