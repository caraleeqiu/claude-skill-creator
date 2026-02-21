import { NextResponse } from "next/server";
import { crawlGitHubSkills } from "@/lib/github-crawler";

// This endpoint can be called by:
// 1. Vercel Cron Jobs (vercel.json)
// 2. External cron services (e.g., cron-job.org)
// 3. Manual trigger via /api/cron/crawl?secret=xxx

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Verify cron secret (skip in development)
  if (process.env.NODE_ENV === "production") {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    // Support both query param and header auth
    if (secret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const startTime = Date.now();
    const token = process.env.GITHUB_TOKEN;
    const skills = await crawlGitHubSkills(token);

    return NextResponse.json({
      success: true,
      count: skills.length,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron crawl error:", error);
    return NextResponse.json(
      { error: "Crawl failed", details: String(error) },
      { status: 500 }
    );
  }
}
