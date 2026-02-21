import { NextResponse } from "next/server";

// 文件上传解析 API
// 支持: TXT, MD, PDF, JSON, YAML
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    // 检查文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "文件过大，请选择 5MB 以内的文件" },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    // 根据文件类型处理
    let content: string;

    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      // PDF 文件处理
      content = await parsePDF(file);
    } else if (
      fileType === "application/json" ||
      fileName.endsWith(".json")
    ) {
      // JSON 文件
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        content = `JSON 文件: ${file.name}\n\n${JSON.stringify(json, null, 2)}`;
      } catch {
        content = text;
      }
    } else if (
      fileType === "text/yaml" ||
      fileName.endsWith(".yaml") ||
      fileName.endsWith(".yml")
    ) {
      // YAML 文件
      const text = await file.text();
      content = `YAML 文件: ${file.name}\n\n${text}`;
    } else {
      // 纯文本 / Markdown
      content = await file.text();
    }

    if (!content || content.length < 10) {
      return NextResponse.json(
        { error: "文件内容为空或无法解析" },
        { status: 400 }
      );
    }

    // 截取过长内容
    if (content.length > 50000) {
      content = content.slice(0, 50000) + "\n\n[内容已截断，原文件过长]";
    }

    return NextResponse.json({
      content,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "文件解析失败" }, { status: 500 });
  }
}

// PDF 解析 (简单实现，提取文本)
async function parsePDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 简单的 PDF 文本提取
    // 查找文本流并提取
    const text = extractTextFromPDF(uint8Array);

    if (text && text.length > 50) {
      return `PDF 文件: ${file.name}\n\n${text}`;
    }

    // 如果提取失败，返回提示
    return `PDF 文件: ${file.name}\n\n[PDF 解析受限，请尝试复制文本内容后粘贴]`;
  } catch (e) {
    console.error("PDF parse error:", e);
    return `PDF 文件: ${file.name}\n\n[PDF 解析失败，请手动复制内容]`;
  }
}

// 简单的 PDF 文本提取 (不依赖外部库)
function extractTextFromPDF(data: Uint8Array): string {
  const text: string[] = [];
  const decoder = new TextDecoder("utf-8", { fatal: false });

  // 转换为字符串以便搜索
  const pdfString = decoder.decode(data);

  // 查找文本对象 (BT ... ET)
  const textObjectRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match;

  while ((match = textObjectRegex.exec(pdfString)) !== null) {
    const content = match[1];

    // 提取 Tj 和 TJ 操作符中的文本
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(content)) !== null) {
      text.push(decodeEscapedString(tjMatch[1]));
    }

    // TJ 数组
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjArrayMatch;
    while ((tjArrayMatch = tjArrayRegex.exec(content)) !== null) {
      const arrayContent = tjArrayMatch[1];
      const stringRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = stringRegex.exec(arrayContent)) !== null) {
        text.push(decodeEscapedString(strMatch[1]));
      }
    }
  }

  // 清理和格式化
  return text
    .join("")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 解码 PDF 转义字符串
function decodeEscapedString(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}
