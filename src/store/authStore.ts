import { create } from "zustand";

interface GithubUser {
  login: string;
  avatar: string;
}

interface AuthStore {
  user: GithubUser | null;
  isAuthenticated: boolean;
  loading: boolean;

  // Actions
  setUser: (user: GithubUser | null) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// 从 cookie 读取用户信息 (非 httpOnly 的 github_user cookie)
function getUserFromCookie(): GithubUser | null {
  if (typeof document === "undefined") return null;

  try {
    const cookies = document.cookie.split(";");
    const userCookie = cookies.find((c) => c.trim().startsWith("github_user="));
    if (!userCookie) return null;

    const value = decodeURIComponent(userCookie.split("=")[1]);
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      loading: false,
    }),

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout failed:", e);
    }
    set({ user: null, isAuthenticated: false, loading: false });
  },

  checkAuth: async () => {
    set({ loading: true });

    // 先尝试从 cookie 快速读取
    const cookieUser = getUserFromCookie();
    if (cookieUser) {
      set({ user: cookieUser, isAuthenticated: true, loading: false });
    }

    // 然后通过 API 验证 token 是否有效
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const user = await res.json();
        set({ user, isAuthenticated: true, loading: false });
      } else {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },
}));
