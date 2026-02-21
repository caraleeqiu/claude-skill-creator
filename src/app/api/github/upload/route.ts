import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export async function POST(request: Request) {
  try {
    const { token, repoName, skillMd, readme, description, isPrivate } = await request.json();

    if (!token || !repoName || !skillMd) {
      return NextResponse.json(
        { error: "缺少必要参数: token, repoName, skillMd" },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: token });

    // 获取用户信息
    const { data: user } = await octokit.users.getAuthenticated();

    // 检查仓库是否存在
    let repoExists = false;
    try {
      await octokit.repos.get({ owner: user.login, repo: repoName });
      repoExists = true;
    } catch {
      repoExists = false;
    }

    // 创建仓库（如果不存在）
    if (!repoExists) {
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: description || `Claude Skill: ${repoName}`,
        private: isPrivate || false,
        auto_init: false,
      });

      // 等待仓库创建完成
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 上传 SKILL.md
    const skillContent = Buffer.from(skillMd).toString("base64");

    // 检查文件是否存在（用于更新）
    let skillSha: string | undefined;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner: user.login,
        repo: repoName,
        path: "SKILL.md",
      });
      if ("sha" in existingFile) {
        skillSha = existingFile.sha;
      }
    } catch {
      // 文件不存在，跳过
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: user.login,
      repo: repoName,
      path: "SKILL.md",
      message: skillSha ? "Update SKILL.md" : "Add SKILL.md",
      content: skillContent,
      sha: skillSha,
    });

    // 上传 README.md
    if (readme) {
      const readmeContent = Buffer.from(readme).toString("base64");

      let readmeSha: string | undefined;
      try {
        const { data: existingReadme } = await octokit.repos.getContent({
          owner: user.login,
          repo: repoName,
          path: "README.md",
        });
        if ("sha" in existingReadme) {
          readmeSha = existingReadme.sha;
        }
      } catch {
        // 文件不存在
      }

      await octokit.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: repoName,
        path: "README.md",
        message: readmeSha ? "Update README.md" : "Add README.md",
        content: readmeContent,
        sha: readmeSha,
      });
    }

    // 添加 topics
    try {
      await octokit.repos.replaceAllTopics({
        owner: user.login,
        repo: repoName,
        names: ["claude-skill", "claude-code", "agent-skills"],
      });
    } catch {
      // 忽略 topics 错误
    }

    return NextResponse.json({
      success: true,
      repoUrl: `https://github.com/${user.login}/${repoName}`,
      installCommand: `git clone https://github.com/${user.login}/${repoName}.git ~/.claude/skills/${repoName}`,
    });
  } catch (error) {
    console.error("GitHub upload error:", error);
    return NextResponse.json(
      { error: `上传失败: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
