import { NextResponse } from "next/server";
import {
  convertToOpenClaw,
  convertToClaude,
  detectSkillFormat,
  autoConvert,
} from "@/lib/openclaw-generator";
import {
  generateSkillFromSpec,
  type SkillSpec,
} from "@/lib/skill-generator";

// POST /api/skills/convert
// 在 Claude 和 OpenClaw 格式之间转换
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, targetFormat, spec } = body;

    // 如果提供了 spec，直接生成目标格式
    if (spec) {
      if (targetFormat === "openclaw") {
        const result = convertToOpenClaw(spec as SkillSpec);
        return NextResponse.json({
          success: true,
          format: "openclaw",
          result: {
            name: result.name,
            skillTs: result.skillTs,
            readme: result.readme,
            category: result.category,
            tags: result.tags,
          },
        });
      } else {
        const result = generateSkillFromSpec(spec as SkillSpec);
        return NextResponse.json({
          success: true,
          format: "claude",
          result,
        });
      }
    }

    // 自动检测并转换
    if (!content) {
      return NextResponse.json(
        { error: "请提供要转换的内容或 spec" },
        { status: 400 }
      );
    }

    const sourceFormat = detectSkillFormat(content);
    const target = targetFormat || (sourceFormat === "claude" ? "openclaw" : "claude");

    const conversion = autoConvert(content, target);

    if (!conversion.success) {
      return NextResponse.json(
        { error: conversion.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sourceFormat,
      targetFormat: target,
      result: conversion.result,
    });
  } catch (error) {
    console.error("Error converting skill:", error);
    return NextResponse.json(
      { error: "转换失败" },
      { status: 500 }
    );
  }
}

// GET /api/skills/convert?detect=true&content=...
// 检测内容格式
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const content = searchParams.get("content");

  if (!content) {
    return NextResponse.json({ format: "unknown" });
  }

  const format = detectSkillFormat(content);
  return NextResponse.json({ format });
}
