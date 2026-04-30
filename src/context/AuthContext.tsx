import React, { createContext, useContext, useState, useEffect } from "react";
import { type User } from "../data/mockData";
import { authApi, predictionsApi, setToken, removeToken, getToken } from "../services/api";

export interface Prediction {
  matchId: string;
  scoreA: number | "";
  scoreB: number | "";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<"ok" | "unconfirmed" | "invalid">;
  register: (userData: RegisterUser) => Promise<{ success: boolean; pendingEmail?: string }>;
  confirmEmail: (email: string, code: string) => Promise<boolean>;
  resendConfirmation: (email: string) => Promise<boolean>;
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

export type RegisterUser = Omit<User, "id" | "role"> & { password: string };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userPredictions, setUserPredictions] = useState<Record<string, Prediction>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("jogos_unisanta_user");
    const savedToken = localStorage.getItem("jogos_unisanta_token");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    // Se tem usuário salvo mas não tem token JWT, limpa a sessão
    // (pode ter sido salvo antes da migração para o backend)
    if (savedUser && !savedToken) {
      localStorage.removeItem("jogos_unisanta_user");
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  // ── Predictions ─────────────────────────────────────────────────────────────

  const fetchUserPredictions = async () => {
    if (!user) return;
    try {
      const data = await predictionsApi.getAll();
      setUserPredictions(data as Record<string, Prediction>);
    } catch (err) {
      console.error("Erro ao buscar previsões:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserPredictions();
    } else {
      setUserPredictions({});
    }
  }, [user?.email]);

  // ── Login ────────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<"ok" | "unconfirmed" | "invalid"> => {
    try {
      const res = await authApi.login(email, password);

      if (res.status !== "ok" || !res.user || !res.token) {
        return res.status as "unconfirmed" | "invalid";
      }

      const mappedUser = res.user as unknown as User;
      setToken(res.token);
      setUser(mappedUser);
      localStorage.setItem("jogos_unisanta_user", JSON.stringify(mappedUser));
      return "ok";
    } catch (err: any) {
      if (err?.status === 403) return "unconfirmed";
      return "invalid";
    }
  };

  // ── Register ─────────────────────────────────────────────────────────────────

  const register = async (userData: RegisterUser): Promise<{ success: boolean; pendingEmail?: string }> => {
    try {
      const res = await authApi.register({
        email: userData.email,
        name: userData.name,
        surname: userData.surname,
        preferredCourse: userData.preferredCourse,
        favoriteTeam: userData.favoriteTeam,
        password: userData.password,
      });
      return res;
    } catch (err: any) {
      console.error("Erro ao registrar:", err);
      return { success: false };
    }
  };

  // ── Confirm Email ─────────────────────────────────────────────────────────────

  const confirmEmail = async (email: string, code: string): Promise<boolean> => {
    try {
      const res = await authApi.confirmEmail(email, code);
      if (!res.success || !res.user || !res.token) return false;

      const mappedUser = res.user as unknown as User;
      setToken(res.token);
      setUser(mappedUser);
      localStorage.setItem("jogos_unisanta_user", JSON.stringify(mappedUser));
      return true;
    } catch {
      return false;
    }
  };

  // ── Resend Confirmation ───────────────────────────────────────────────────────

  const resendConfirmation = async (email: string): Promise<boolean> => {
    try {
      const res = await authApi.resendConfirmation(email);
      return res.success;
    } catch {
      return false;
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────────

  const logout = () => {
    setUser(null);
    removeToken();
    localStorage.removeItem("jogos_unisanta_user");
  };

  // ── Update User ───────────────────────────────────────────────────────────────

  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    try {
      await authApi.updateProfile({
        name: updates.name,
        preferredCourse: updates.preferredCourse,
        favoriteTeam: updates.favoriteTeam,
      });
      const newUser = { ...user, ...updates };
      setUser(newUser);
      localStorage.setItem("jogos_unisanta_user", JSON.stringify(newUser));
      return true;
    } catch {
      return false;
    }
  };

  // ── Save Predictions ──────────────────────────────────────────────────────────

  const saveUserPredictions = async (predictionsToSave: Record<string, Prediction>): Promise<boolean> => {
    if (!user) return false;
    try {
      await predictionsApi.save(predictionsToSave);
      setUserPredictions((prev) => ({ ...prev, ...predictionsToSave }));
      return true;
    } catch (err) {
      console.error("Erro ao salvar previsões:", err);
      return false;
    }
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        confirmEmail,
        resendConfirmation,
        logout,
        updateUser,
        isLoading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        userPredictions,
        fetchUserPredictions,
        saveUserPredictions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
