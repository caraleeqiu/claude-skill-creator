import { NextResponse } from "next/server";
import { crawlGitHubSkills } from "@/lib/github-crawler";
import { DEFAULT_SKILLS } from "@/lib/default-skills";
import type { Skill } from "@/types/skill";
import { USE_CASES } from "@/types/skill";
import { CONFIG } from "@/constants/config";
import crypto from "crypto";

// 服务端内存缓存 (serverless 函数热实例复用)
let cachedSkills: Skill[] | null = null;
let cacheTime = 0;
let cacheETag: string | null = null;

// 生成 ETag
function generateETag(skills: Skill[]): string {
  const hash = crypto.createHash("md5");
  hash.update(JSON.stringify(skills.map((s) => s.repo_url || s.name)));
  return `"${hash.digest("hex").slice(0, 16)}"`;
}

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
  const platform = searchParams.get("platform"); // "claude" | "openclaw" | "all"
  const source = searchParams.get("source"); // "github" | "twitter" | "reddit" | "all"
  const usecase = searchParams.get("usecase"); // 场景搜索
  const refresh = searchParams.get("refresh") === "true";
  const includeSocial = searchParams.get("social") === "true";

  // HTTP 缓存头
  const cacheHeaders = {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    Vary: "Accept-Encoding",
  };

  // 检查 If-None-Match (ETag 条件请求)
  const ifNoneMatch = request.headers.get("If-None-Match");
  if (!refresh && cacheETag && ifNoneMatch === cacheETag) {
    return new Response(null, { status: 304, headers: cacheHeaders });
  }

  // 检查内存缓存
  const cacheValid =
    !refresh &&
    cachedSkills &&
    cachedSkills.length > 0 &&
    Date.now() - cacheTime < CONFIG.CACHE_DURATION_MS;

  if (cacheValid) {
    const filtered = filterSkills(cachedSkills!, { category, search, platform, source, usecase });
    return NextResponse.json(filtered, {
      headers: { ...cacheHeaders, ETag: cacheETag || "" },
    });
  }

  try {
    const token = process.env.GITHUB_TOKEN;

    // 设置 8 秒超时 (Vercel 免费版限制 10 秒)
    const skills = await withTimeout(
      crawlGitHubSkills(token, {
        includeClaude: true,
        includeOpenClaw: true,
        includeSocial,
      }),
      8000
    );

    if (skills && skills.length > 0) {
      cachedSkills = skills;
      cacheTime = Date.now();
      cacheETag = generateETag(skills);

      const filtered = filterSkills(skills, { category, search, platform, source, usecase });
      return NextResponse.json(filtered, {
        headers: { ...cacheHeaders, ETag: cacheETag },
      });
    }
  } catch (error) {
    console.error("Error fetching skills (using defaults):", error);
  }

  // 使用默认数据
  if (!cachedSkills || cachedSkills.length === 0) {
    cachedSkills = DEFAULT_SKILLS;
    cacheTime = Date.now();
    cacheETag = generateETag(DEFAULT_SKILLS);
  }

  const filtered = filterSkills(cachedSkills, { category, search, platform, source, usecase });
  return NextResponse.json(filtered, {
    headers: { ...cacheHeaders, ETag: cacheETag || "" },
  });
}

interface FilterOptions {
  category: string | null;
  search: string | null;
  platform: string | null;
  source: string | null;
  usecase: string | null;
}

function filterSkills(skills: Skill[], options: FilterOptions) {
  const { category, search, platform, source, usecase } = options;

  // 先去重（按 repo_url 或 name + author）
  const seen = new Set<string>();
  let filtered = skills.filter((s) => {
    const key = s.repo_url || `${s.author}/${s.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 按平台筛选
  if (platform && platform !== "all") {
    filtered = filtered.filter((s) =>
      s.platform === platform || s.platform === "both"
    );
  }

  // 按来源筛选
  if (source && source !== "all") {
    filtered = filtered.filter((s) => s.source === source);
  }

  // 按分类筛选
  if (category && category !== "all") {
    filtered = filtered.filter((s) => s.category === category);
  }

  // 场景搜索 - 根据 USE_CASES 的关键词匹配
  if (usecase && usecase !== "all") {
    const useCaseConfig = USE_CASES.find((uc) => uc.id === usecase);
    if (useCaseConfig) {
      const keywords = useCaseConfig.keywords.map((k) => k.toLowerCase());
      const categories = useCaseConfig.categories;

      filtered = filtered.filter((s) => {
        // 匹配分类
        if (categories.includes(s.category)) return true;

        // 匹配关键词（名称、描述、标签）
        const searchText = `${s.name} ${s.description} ${s.tags.join(" ")}`.toLowerCase();
        return keywords.some((kw) => searchText.includes(kw));
      });
    }
  }

  // 搜索
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.author.toLowerCase().includes(q)
    );
  }

  return filtered;
}
