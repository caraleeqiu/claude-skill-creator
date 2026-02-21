import { NextResponse } from "next/server";
import { crawlGitHubSkills } from "@/lib/github-crawler";

// Cache skills for 1 hour
let cachedSkills: Awaited<ReturnType<typeof crawlGitHubSkills>> | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const refresh = searchParams.get("refresh") === "true";

  // Check cache
  if (!refresh && cachedSkills && Date.now() - cacheTime < CACHE_DURATION) {
    return NextResponse.json(filterSkills(cachedSkills, category, search));
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    cachedSkills = await crawlGitHubSkills(token);
    cacheTime = Date.now();

    return NextResponse.json(filterSkills(cachedSkills, category, search));
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }
}

function filterSkills(
  skills: Awaited<ReturnType<typeof crawlGitHubSkills>>,
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
