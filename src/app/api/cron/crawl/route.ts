import { NextResponse } from "next/server";
import { crawlGitHubSkills } from "@/lib/github-crawler";

// Vercel Cron Job - 每 6 小时自动抓取 GitHub Skills
// Schedule: 0 */6 * * * (每天 0:00, 6:00, 12:00, 18:00 UTC)

export async function GET(request: Request) {
  // Vercel Cron 自动添加 CRON_SECRET header
  // https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // 生产环境验证 (Vercel Cron 会自动带上 Bearer token)
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
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
