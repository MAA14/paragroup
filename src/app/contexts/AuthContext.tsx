import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { supabase } from "../../lib/supabase";
import { AuthUser } from "@supabase/supabase-js";

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  userProfile: { username: string; role: string } | null;
  register: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{ success: boolean; error?: string }>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<{
    username: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser(data.session.user);
          setIsAuthenticated(true);
          // Restore user profile from localStorage
          const savedProfile = localStorage.getItem("userProfile");
          if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile));
          }
        } else {
          // No session found
          setUser(null);
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setUser(null);
        setIsAuthenticated(false);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth listener for real-time state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        // Restore user profile from localStorage when auth changes
        const savedProfile = localStorage.getItem("userProfile");
        if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile));
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setUserProfile(null);
        localStorage.removeItem("userProfile");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const register = async (
    email: string,
    password: string,
    username: string,
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        const userProfileData = { username, role: "User" };
        setUserProfile(userProfileData);
        localStorage.setItem("userProfile", JSON.stringify(userProfileData));
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: "Registration failed" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration error";
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session?.user) {
        setUser(data.session.user);
        const userProfileData = {
          username: data.session.user.email?.split("@")[0] || "User",
          role: "User",
        };
        setUserProfile(userProfileData);
        localStorage.setItem("userProfile", JSON.stringify(userProfileData));
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login error";
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      localStorage.removeItem("userProfile");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        userProfile,
        register,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
