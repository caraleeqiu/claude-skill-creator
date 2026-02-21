import { NextResponse } from "next/server";
import {
  generateSkillFromDescription,
  generateSkillFromSpec,
  validateSkillMd,
  type SkillSpec,
} from "@/lib/skill-generator";
import { convertToOpenClaw } from "@/lib/openclaw-generator";
import { parseDocument, parsedDocumentToSpec } from "@/lib/document-parser";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const platform = body.platform || "claude"; // "claude" | "openclaw"
    const mode = body.mode || "description"; // "description" | "document" | "spec"

    let spec: SkillSpec;

    // 模式 1: 从文档/帖子解析
    if (mode === "document" && body.document) {
      const parsed = parseDocument(body.document);
      const parsedSpec = parsedDocumentToSpec(parsed, {
        name: body.name,
        platform,
      });
      spec = {
        name: parsedSpec.name,
        description: parsedSpec.description,
        category: parsedSpec.category,
        triggers: parsedSpec.triggers,
        workflow: parsedSpec.workflow,
        resources: parsedSpec.resources,
        freedom: parsedSpec.freedom,
      };
    }
    // 模式 2: 从 Spec 生成
    else if (body.spec) {
      spec = body.spec as SkillSpec;
      if (!spec.name || !spec.description) {
        return NextResponse.json(
          { error: "spec 缺少必需的 name 或 description 字段" },
          { status: 400 }
        );
      }
    }
    // 模式 3: 从描述生成
    else {
      const { description, name } = body;
      if (!description) {
        return NextResponse.json(
          { error: "请提供 skill 的描述" },
          { status: 400 }
        );
      }
      // 使用现有逻辑转换为 spec
      const generated = generateSkillFromDescription({ description, name });
      spec = {
        name: generated.name,
        description,
        category: generated.category,
        triggers: [`/${generated.name}`],
        workflow: {
          inputs: ["用户请求"],
          steps: ["分析用户需求", "执行任务", "返回结果"],
          outputs: ["处理结果"],
        },
        resources: {
          needsScripts: generated.structure.hasScripts,
          needsReferences: generated.structure.hasReferences,
          suggestedScripts: [],
          suggestedReferences: [],
        },
        freedom: "medium",
      };
    }

    // 根据目标平台生成
    if (platform === "openclaw") {
      const openclawSkill = convertToOpenClaw(spec);
      return NextResponse.json({
        platform: "openclaw",
        name: openclawSkill.name,
        skillTs: openclawSkill.skillTs,
        readme: openclawSkill.readme,
        category: openclawSkill.category,
        tags: openclawSkill.tags,
        installCommand: `openclaw plugin install ${openclawSkill.name}`,
        validation: { valid: true, errors: [], warnings: [] },
      });
    }

    // Claude 平台
    const generated = generateSkillFromSpec(spec);
    const validation = validateSkillMd(generated.skillMd);
    const rawUrl = `https://raw.githubusercontent.com/YOUR_USERNAME/${generated.name}/main/SKILL.md`;
    const installCommand = `mkdir -p ~/.claude/commands && curl -sL "${rawUrl}" -o ~/.claude/commands/${generated.name}.md`;

    return NextResponse.json({
      platform: "claude",
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
