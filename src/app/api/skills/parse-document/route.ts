import { NextResponse } from "next/server";
import { parseDocument, parsedDocumentToSpec } from "@/lib/document-parser";

// POST /api/skills/parse-document
// 从文档/帖子中解析并生成 Skill Spec
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, name, platform = "claude" } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "请提供要解析的文档内容" },
        { status: 400 }
      );
    }

    if (content.length < 50) {
      return NextResponse.json(
        { error: "文档内容太短，请提供更详细的内容" },
        { status: 400 }
      );
    }

    if (content.length > 100000) {
      return NextResponse.json(
        { error: "文档内容过长，请精简到 100KB 以内" },
        { status: 400 }
      );
    }

    // 解析文档
    const parsed = parseDocument(content);

    // 转换为 Skill Spec
    const spec = parsedDocumentToSpec(parsed, { name, platform });

    return NextResponse.json({
      parsed,
      spec,
      suggestions: generateSuggestions(parsed),
    });
  } catch (error) {
    console.error("Error parsing document:", error);
    return NextResponse.json(
      { error: "解析文档失败" },
      { status: 500 }
    );
  }
}

// 根据解析结果生成改进建议
function generateSuggestions(parsed: ReturnType<typeof parseDocument>): string[] {
  const suggestions: string[] = [];

  if (parsed.confidence < 0.5) {
    suggestions.push("文档结构不够清晰，建议添加明确的步骤列表");
  }

  if (parsed.steps.length === 0) {
    suggestions.push("未检测到操作步骤，建议使用 1. 2. 3. 格式列出步骤");
  }

  if (parsed.triggers.length === 0) {
    suggestions.push("未检测到触发条件，建议描述什么情况下使用这个 Skill");
  }

  if (parsed.codeBlocks.length === 0 && parsed.category === "dev-tools") {
    suggestions.push("开发工具类 Skill 建议包含代码示例");
  }

  if (parsed.summary.length < 50) {
    suggestions.push("描述过于简短，建议提供更详细的说明");
  }

  return suggestions;
}
