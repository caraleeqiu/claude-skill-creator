import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Skill } from "@/types/skill";
import { CONFIG } from "@/constants/config";

interface Filters {
  search: string;
  category: string;
  platform: "all" | "claude" | "openclaw";
  usecase: string;
}

interface SkillStore {
  // 数据
  skills: Skill[];
  filteredSkills: Skill[];
  lastFetchTime: number;

  // 状态
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // 筛选条件
  filters: Filters;

  // Actions
  setSkills: (skills: Skill[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  fetchSkills: (refresh?: boolean) => Promise<void>;
  isCacheValid: () => boolean;
}

const defaultFilters: Filters = {
  search: "",
  category: "all",
  platform: "all",
  usecase: "all",
};

// 客户端筛选逻辑
function filterSkills(skills: Skill[], filters: Filters): Skill[] {
  let result = [...skills];

  // 平台筛选
  if (filters.platform !== "all") {
    result = result.filter(
      (s) => s.platform === filters.platform || s.platform === "both"
    );
  }

  // 分类筛选
  if (filters.category !== "all") {
    result = result.filter((s) => s.category === filters.category);
  }

  // 搜索
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.author.toLowerCase().includes(q)
    );
  }

  return result;
}

export const useSkillStore = create<SkillStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      skills: [],
      filteredSkills: [],
      lastFetchTime: 0,
      loading: true,
      refreshing: false,
      error: null,
      filters: defaultFilters,

      // Actions
      setSkills: (skills) => {
        const { filters } = get();
        set({
          skills,
          filteredSkills: filterSkills(skills, filters),
          lastFetchTime: Date.now(),
        });
      },

      setLoading: (loading) => set({ loading }),
      setRefreshing: (refreshing) => set({ refreshing }),
      setError: (error) => set({ error }),

      setFilter: (key, value) => {
        const { skills, filters } = get();
        const newFilters = { ...filters, [key]: value };
        set({
          filters: newFilters,
          filteredSkills: filterSkills(skills, newFilters),
        });
      },

      resetFilters: () => {
        const { skills } = get();
        set({
          filters: defaultFilters,
          filteredSkills: filterSkills(skills, defaultFilters),
        });
      },

      isCacheValid: () => {
        const { skills, lastFetchTime } = get();
        return (
          skills.length > 0 &&
          Date.now() - lastFetchTime < CONFIG.CACHE_DURATION_MS
        );
      },

      fetchSkills: async (refresh = false) => {
        const { filters, isCacheValid, skills } = get();

        // 使用本地缓存 (非强制刷新且缓存有效)
        if (!refresh && isCacheValid()) {
          set({
            loading: false,
            filteredSkills: filterSkills(skills, filters),
          });
          return;
        }

        if (refresh) {
          set({ refreshing: true });
        } else {
          set({ loading: true });
        }

        try {
          const params = new URLSearchParams();
          if (filters.usecase !== "all") params.set("usecase", filters.usecase);
          if (refresh) params.set("refresh", "true");

          const res = await fetch(`/api/skills?${params}`);
          if (!res.ok) throw new Error("Failed to fetch skills");

          const data = await res.json();
          const newSkills = Array.isArray(data) ? data : [];

          set({
            skills: newSkills,
            filteredSkills: filterSkills(newSkills, filters),
            lastFetchTime: Date.now(),
            error: null,
          });
        } catch (e) {
          console.error("Failed to fetch skills:", e);
          set({ error: "获取 Skills 失败" });
        } finally {
          set({ loading: false, refreshing: false });
        }
      },
    }),
    {
      name: "skill-store",
      storage: createJSONStorage(() => localStorage),
      // 只持久化数据，不持久化 UI 状态
      partialize: (state) => ({
        skills: state.skills,
        lastFetchTime: state.lastFetchTime,
      }),
      // 恢复时重新计算 filteredSkills
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.filteredSkills = filterSkills(state.skills, state.filters);
          state.loading = false;
        }
      },
    }
  )
);
