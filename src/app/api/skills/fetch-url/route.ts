import { NextResponse } from "next/server";

// URL 内容抓取 API
// 支持: Twitter/X, Reddit, GitHub, 普通网页
export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "请提供 URL" }, { status: 400 });
    }

    // 验证 URL 格式
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "无效的 URL 格式" }, { status: 400 });
    }

    const host = parsedUrl.hostname.toLowerCase();

    // 根据来源选择抓取方式
    let content: string;
    let source: string;
    let title: string = "";

    if (host.includes("twitter.com") || host.includes("x.com")) {
      const result = await fetchTwitterContent(url);
      content = result.content;
      source = "twitter";
      title = result.title;
    } else if (host.includes("reddit.com")) {
      const result = await fetchRedditContent(url);
      content = result.content;
      source = "reddit";
      title = result.title;
    } else if (host.includes("github.com")) {
      const result = await fetchGitHubContent(url, parsedUrl);
      content = result.content;
      source = "github";
      title = result.title;
    } else {
      const result = await fetchGenericContent(url);
      content = result.content;
      source = "web";
      title = result.title;
    }

    if (!content || content.length < 20) {
      return NextResponse.json(
        { error: "无法获取有效内容，请手动复制粘贴" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      content,
      source,
      title,
      url,
    });
  } catch (error) {
    console.error("Fetch URL error:", error);
    return NextResponse.json(
      { error: "获取内容失败，请手动复制粘贴" },
      { status: 500 }
    );
  }
}

// Twitter/X 内容抓取 (使用 nitter 或直接解析)
async function fetchTwitterContent(url: string): Promise<{ content: string; title: string }> {
  // 尝试使用 publish.twitter.com oembed API
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "Claude-Skill-Creator/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      // 从 HTML 中提取文本
      const htmlContent = data.html || "";
      const textContent = htmlContent
        .replace(/<[^>]*>/g, "\n")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();

      return {
        content: `来源: Twitter/X\n作者: ${data.author_name || "Unknown"}\n\n${textContent}`,
        title: `Tweet by ${data.author_name || "Unknown"}`,
      };
    }
  } catch (e) {
    console.error("Twitter oembed failed:", e);
  }

  return {
    content: `Twitter/X 帖子链接: ${url}\n\n请手动复制帖子内容粘贴到下方`,
    title: "Twitter Post",
  };
}

// Reddit 内容抓取
async function fetchRedditContent(url: string): Promise<{ content: string; title: string }> {
  try {
    // Reddit JSON API
    const jsonUrl = url.replace(/\/?$/, ".json");
    const res = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "Claude-Skill-Creator/1.0",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      const post = data[0]?.data?.children?.[0]?.data;

      if (post) {
        const title = post.title || "";
        const selftext = post.selftext || "";
        const author = post.author || "Unknown";
        const subreddit = post.subreddit || "";

        // 获取热门评论
        const comments = data[1]?.data?.children || [];
        const topComments = comments
          .slice(0, 5)
          .filter((c: { kind: string }) => c.kind === "t1")
          .map((c: { data: { body: string; author: string } }) => `- ${c.data.author}: ${c.data.body}`)
          .join("\n");

        return {
          content: `来源: Reddit r/${subreddit}\n作者: u/${author}\n标题: ${title}\n\n${selftext}\n\n热门评论:\n${topComments}`,
          title,
        };
      }
    }
  } catch (e) {
    console.error("Reddit fetch failed:", e);
  }

  return {
    content: `Reddit 帖子链接: ${url}\n\n请手动复制帖子内容粘贴到下方`,
    title: "Reddit Post",
  };
}

// GitHub 内容抓取 (README, Issues, Discussions)
async function fetchGitHubContent(url: string, parsedUrl: URL): Promise<{ content: string; title: string }> {
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    "User-Agent": "Claude-Skill-Creator/1.0",
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    // GitHub Issue
    if (pathParts.includes("issues") && pathParts.length >= 4) {
      const [owner, repo, , issueNumber] = pathParts;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;
      const res = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(5000) });

      if (res.ok) {
        const issue = await res.json();
        return {
          content: `来源: GitHub Issue\n仓库: ${owner}/${repo}\n标题: ${issue.title}\n作者: ${issue.user?.login}\n\n${issue.body || ""}`,
          title: issue.title,
        };
      }
    }

    // GitHub Discussion
    if (pathParts.includes("discussions") && pathParts.length >= 4) {
      return {
        content: `GitHub Discussion 链接: ${url}\n\n请手动复制讨论内容粘贴到下方`,
        title: "GitHub Discussion",
      };
    }

    // GitHub Repo README
    if (pathParts.length >= 2 && !pathParts.includes("issues") && !pathParts.includes("pull")) {
      const [owner, repo] = pathParts;
      const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
      const res = await fetch(readmeUrl, { headers, signal: AbortSignal.timeout(5000) });

      if (res.ok) {
        const data = await res.json();
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        return {
          content: `来源: GitHub README\n仓库: ${owner}/${repo}\n\n${content}`,
          title: `${owner}/${repo}`,
        };
      }
    }
  } catch (e) {
    console.error("GitHub fetch failed:", e);
  }

  return {
    content: `GitHub 链接: ${url}\n\n请手动复制内容粘贴到下方`,
    title: "GitHub Content",
  };
}

// 通用网页抓取
async function fetchGenericContent(url: string): Promise<{ content: string; title: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Claude-Skill-Creator/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const html = await res.text();

      // 提取标题
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";

      // 提取主要内容 (简单实现)
      let content = html
        // 移除 script, style, nav, header, footer
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<header[\s\S]*?<\/header>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
        // 保留段落和标题的换行
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/h[1-6]>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<li[^>]*>/gi, "- ")
        .replace(/<\/li>/gi, "\n")
        // 移除其他标签
        .replace(/<[^>]+>/g, "")
        // 解码 HTML 实体
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // 清理多余空白
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .trim();

      // 截取前 10000 字符
      if (content.length > 10000) {
        content = content.slice(0, 10000) + "\n\n[内容已截断...]";
      }

      return {
        content: `来源: ${new URL(url).hostname}\n标题: ${title}\n\n${content}`,
        title,
      };
    }
  } catch (e) {
    console.error("Generic fetch failed:", e);
  }

  return {
    content: `网页链接: ${url}\n\n请手动复制内容粘贴到下方`,
    title: "Web Page",
  };
}
