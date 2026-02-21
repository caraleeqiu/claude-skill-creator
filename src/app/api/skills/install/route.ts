import { NextResponse } from "next/server";
import { generateInstallScript } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { skillName, repoUrl } = await request.json();

    if (!skillName || !repoUrl) {
      return NextResponse.json(
        { error: "Missing skillName or repoUrl" },
        { status: 400 }
      );
    }

    const script = generateInstallScript(skillName, repoUrl);

    return NextResponse.json({ script });
  } catch (error) {
    console.error("Error generating install script:", error);
    return NextResponse.json(
      { error: "Failed to generate install script" },
      { status: 500 }
    );
  }
}
