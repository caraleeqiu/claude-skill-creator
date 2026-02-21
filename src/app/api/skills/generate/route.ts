import { NextResponse } from "next/server";
import { generateSkillFromDescription, validateSkillMd } from "@/lib/skill-generator";

export async function POST(request: Request) {
  try {
    const { description, name } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: "请提供 skill 的描述" },
        { status: 400 }
      );
    }

    // 生成 skill
    const generated = generateSkillFromDescription({ description, name });

    // 验证生成的 skill
    const validation = validateSkillMd(generated.skillMd);

    return NextResponse.json({
      ...generated,
      validation,
      installCommand: `mkdir -p ~/.claude/skills/${generated.name} && echo '${generated.skillMd.replace(/'/g, "'\\''")}' > ~/.claude/skills/${generated.name}/SKILL.md`,
    });
  } catch (error) {
    console.error("Error generating skill:", error);
    return NextResponse.json(
      { error: "生成 skill 失败" },
      { status: 500 }
    );
  }
}
