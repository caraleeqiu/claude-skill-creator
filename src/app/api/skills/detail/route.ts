import { NextResponse } from "next/server";
import { getSkillDetails } from "@/lib/github-crawler";
import { scanSkillContent } from "@/lib/security-scanner";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repo");

  if (!repoUrl) {
    return NextResponse.json({ error: "Missing repo URL" }, { status: 400 });
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const details = await getSkillDetails(repoUrl, token);

    if (!details) {
      return NextResponse.json({ error: "Failed to fetch details" }, { status: 404 });
    }

    // 安全扫描
    let security = null;
    if (details.skillMd) {
      security = scanSkillContent(details.skillMd);
    }

    return NextResponse.json({
      ...details,
      security,
    });
  } catch (error) {
    console.error("Error fetching skill details:", error);
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
