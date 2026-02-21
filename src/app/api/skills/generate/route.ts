import { NextResponse } from "next/server";
import {
  generateSkillFromDescription,
  generateSkillFromSpec,
  validateSkillMd,
  type SkillSpec,
} from "@/lib/skill-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 支持两种模式:
    // 1. 简单模式: { description, name? } - 直接从描述生成
    // 2. Spec 模式: { spec: SkillSpec } - 从结构化规格生成

    let generated;

    if (body.spec) {
      // Spec 模式 - 使用结构化规格生成
      const spec = body.spec as SkillSpec;

      if (!spec.name || !spec.description) {
        return NextResponse.json(
          { error: "spec 缺少必需的 name 或 description 字段" },
          { status: 400 }
        );
      }

      generated = generateSkillFromSpec(spec);
    } else {
      // 简单模式 - 从描述直接生成
      const { description, name } = body;

      if (!description) {
        return NextResponse.json(
          { error: "请提供 skill 的描述" },
          { status: 400 }
        );
      }

      generated = generateSkillFromDescription({ description, name });
    }

    // 验证生成的 skill
    const validation = validateSkillMd(generated.skillMd);

    // 生成安装命令 (使用正确的路径 ~/.claude/commands/)
    const rawUrl = `https://raw.githubusercontent.com/YOUR_USERNAME/${generated.name}/main/SKILL.md`;
    const installCommand = `mkdir -p ~/.claude/commands && curl -sL "${rawUrl}" -o ~/.claude/commands/${generated.name}.md`;

    return NextResponse.json({
      ...generated,
      validation,
      installCommand,
    });
  } catch (error) {
    console.error("Error generating skill:", error);
    return NextResponse.json(
      { error: "生成 skill 失败" },
      { status: 500 }
    );
  }
}
