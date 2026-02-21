import { NextResponse } from "next/server";
import JSZip from "jszip";

// 下载 skill 文件为 ZIP
export async function POST(request: Request) {
  try {
    const { name, skillMd, readme } = await request.json();

    if (!name || !skillMd) {
      return NextResponse.json(
        { error: "Missing name or skillMd" },
        { status: 400 }
      );
    }

    // 创建 ZIP 文件
    const zip = new JSZip();
    const folder = zip.folder(name);

    if (folder) {
      folder.file("SKILL.md", skillMd);
      if (readme) {
        folder.file("README.md", readme);
      }
    }

    const zipContent = await zip.generateAsync({ type: "base64" });

    return NextResponse.json({
      filename: `${name}.zip`,
      content: zipContent,
      contentType: "application/zip",
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to create download" },
      { status: 500 }
    );
  }
}
