import { NextResponse } from "next/server";
import { crawlGitHubSkills } from "@/lib/github-crawler";
import { DEFAULT_SKILLS } from "@/lib/default-skills";
import type { Skill } from "@/types/skill";

// Cache skills for 1 hour
let cachedSkills: Skill[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// 带超时的 Promise
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ]);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const refresh = searchParams.get("refresh") === "true";

  // Check cache first
  if (!refresh && cachedSkills && cachedSkills.length > 0 && Date.now() - cacheTime < CACHE_DURATION) {
    return NextResponse.json(filterSkills(cachedSkills, category, search));
  }

  try {
    const token = process.env.GITHUB_TOKEN;

    // 设置 8 秒超时 (Vercel 免费版限制 10 秒)
    const skills = await withTimeout(crawlGitHubSkills(token), 8000);

    if (skills && skills.length > 0) {
      cachedSkills = skills;
      cacheTime = Date.now();
      return NextResponse.json(filterSkills(skills, category, search));
    }
  } catch (error) {
    console.error("Error fetching skills (using defaults):", error);
  }

  // 使用默认数据
  if (!cachedSkills || cachedSkills.length === 0) {
    cachedSkills = DEFAULT_SKILLS;
    cacheTime = Date.now();
  }

  return NextResponse.json(filterSkills(cachedSkills, category, search));
}

function filterSkills(
  skills: Skill[],
  category: string | null,
  search: string | null
) {
  let filtered = skills;

  if (category && category !== "all") {
    filtered = filtered.filter((s) => s.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return filtered;
}
