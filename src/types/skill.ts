// Skill 核心类型定义
export interface Skill {
  id: string;
  name: string;
  description: string;
  author: string;
  repo_url: string;
  stars: number;
  category: string;
  tags: string[];
  skill_md_url: string;
  created_at: string;
  updated_at: string;
  platform: "claude" | "openclaw" | "both";
  source: "github" | "twitter" | "reddit" | "manual";
  source_url?: string;
}

// Re-export from constants for backward compatibility
export { SKILL_CATEGORIES, type SkillCategory } from "@/constants/categories";
export { USE_CASES, type UseCase } from "@/constants/useCases";
