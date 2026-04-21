import React, { createContext, useContext, useState, useEffect } from "react";
import { type User } from "../data/mockData";
import { supabase } from "../services/supabaseClient";
import bcrypt from "bcryptjs";
import emailjs from "@emailjs/browser";

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

const EMAILJS_SERVICE = "service_ii1iyfx";
const EMAILJS_CONFIRM_TEMPLATE = "template_lv3rmfd";
const EMAILJS_PUBLIC_KEY = "XvjwBC5uhPLAPa70n";

const TOKEN_EXPIRY_MINUTES = 15;

const generateToken = () => String(Math.floor(10000 + Math.random() * 90000));
const tokenExpiresAt = () => new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userPredictions, setUserPredictions] = useState<Record<string, Prediction>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("jogos_unisanta_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const fetchUserPredictions = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("predictions").select("*").eq("user_email", user.email);

    if (!error && data) {
      const preds: Record<string, Prediction> = {};
      data.forEach((p: any) => {
        preds[p.match_id] = {
          matchId: p.match_id,
          scoreA: p.score_a,
          scoreB: p.score_b,
        };
      });
      setUserPredictions(preds);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserPredictions();
    } else {
      setUserPredictions({});
    }
  }, [user?.email]);

  const login = async (email: string, password: string): Promise<"ok" | "unconfirmed" | "invalid"> => {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single();
    if (error || !data) return "invalid";
    if (!data.password) return "invalid";

    const isValid = await bcrypt.compare(password, data.password);
    if (!isValid) return "invalid";

    if (data.logintoken) return "unconfirmed";

    const mappedUser = {
      ...data,
      preferredCourse: data.preferredcourse,
      favoriteTeam: data.favoriteteam,
    };
    delete mappedUser.preferredcourse;
    delete mappedUser.favoriteteam;

    setUser(mappedUser);
    localStorage.setItem("jogos_unisanta_user", JSON.stringify(mappedUser));
    return "ok";
  };

  const register = async (userData: RegisterUser): Promise<{ success: boolean; pendingEmail?: string }> => {
    const hash = await bcrypt.hash(userData.password, 10);
    const loginToken = generateToken();

    const { error } = await supabase.from("users").insert([
      {
        email: userData.email,
        name: userData.name,
        surname: userData.surname,
        preferredcourse: userData.preferredCourse,
        favoriteteam: userData.favoriteTeam,
        password: hash,
        role: "cliente",
        logintoken: loginToken,
        logintoken_expires_at: tokenExpiresAt(),
      },
    ]);

    if (error) return { success: false };

    try {
      await emailjs.send(
        EMAILJS_SERVICE,
        EMAILJS_CONFIRM_TEMPLATE,
        { email: userData.email, passcode: loginToken, time: `${TOKEN_EXPIRY_MINUTES} minutos` },
        EMAILJS_PUBLIC_KEY,
      );
    } catch {}

    return { success: true, pendingEmail: userData.email };
  };

  const confirmEmail = async (email: string, code: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("users")
      .select("logintoken, logintoken_expires_at")
      .eq("email", email)
      .single();

    if (error || !data) return false;
    if (data.logintoken !== code) return false;
    if (!data.logintoken_expires_at || new Date() > new Date(data.logintoken_expires_at)) return false;

    const { error: updateError } = await supabase.from("users").update({ logintoken: null }).eq("email", email);

    if (updateError) return false;

    const { data: fullUser, error: fetchError } = await supabase.from("users").select("*").eq("email", email).single();

    if (fetchError || !fullUser) return false;

    const mappedUser = {
      ...fullUser,
      preferredCourse: fullUser.preferredcourse,
      favoriteTeam: fullUser.favoriteteam,
    };
    delete mappedUser.preferredcourse;
    delete mappedUser.favoriteteam;

    setUser(mappedUser);
    localStorage.setItem("jogos_unisanta_user", JSON.stringify(mappedUser));
    return true;
  };

  const resendConfirmation = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase.from("users").select("logintoken").eq("email", email).single();

    if (error || !data) return false;
    if (!data.logintoken) return false;

    const newToken = generateToken();

    const { error: updateError } = await supabase
      .from("users")
      .update({ logintoken: newToken, logintoken_expires_at: tokenExpiresAt() })
      .eq("email", email);

    if (updateError) return false;

    try {
      await emailjs.send(
        EMAILJS_SERVICE,
        EMAILJS_CONFIRM_TEMPLATE,
        { email, passcode: newToken, time: `${TOKEN_EXPIRY_MINUTES} minutos` },
        EMAILJS_PUBLIC_KEY,
      );
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("jogos_unisanta_user");
  };

  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.preferredCourse !== undefined) dbUpdates.preferredcourse = updates.preferredCourse;
    if (updates.favoriteTeam !== undefined) dbUpdates.favoriteteam = updates.favoriteTeam;

    const { error } = await supabase.from("users").update(dbUpdates).eq("email", user.email);
    if (!error) {
      const newUser = { ...user, ...updates };
      setUser(newUser);
      localStorage.setItem("jogos_unisanta_user", JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const saveUserPredictions = async (predictionsToSave: Record<string, Prediction>): Promise<boolean> => {
    if (!user) return false;

    const rows = Object.values(predictionsToSave).map((p) => ({
      user_email: user.email,
      match_id: p.matchId,
      score_a: p.scoreA === "" ? 0 : p.scoreA,
      score_b: p.scoreB === "" ? 0 : p.scoreB,
    }));

    if (rows.length === 0) return true;

    const { error } = await supabase.from("predictions").upsert(rows, { onConflict: "user_email,match_id" });

    if (!error) {
      setUserPredictions((prev) => ({ ...prev, ...predictionsToSave }));
      return true;
    }
    console.error("Error saving predictions:", error);
    return false;
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
