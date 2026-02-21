import { NextResponse } from "next/server";

// URL 内容抓取 API
// 支持: Twitter/X, Reddit, GitHub, 小红书, 抖音, B站, 知乎, 微博, 微信公众号, 普通网页
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
    } else if (host.includes("xiaohongshu.com") || host.includes("xhslink.com")) {
      const result = await fetchXiaohongshuContent(url);
      content = result.content;
      source = "xiaohongshu";
      title = result.title;
    } else if (host.includes("douyin.com") || host.includes("iesdouyin.com")) {
      const result = await fetchDouyinContent(url);
      content = result.content;
      source = "douyin";
      title = result.title;
    } else if (host.includes("bilibili.com") || host.includes("b23.tv")) {
      const result = await fetchBilibiliContent(url, parsedUrl);
      content = result.content;
      source = "bilibili";
      title = result.title;
    } else if (host.includes("zhihu.com")) {
      const result = await fetchZhihuContent(url, parsedUrl);
      content = result.content;
      source = "zhihu";
      title = result.title;
    } else if (host.includes("weibo.com") || host.includes("weibo.cn")) {
      const result = await fetchWeiboContent(url);
      content = result.content;
      source = "weibo";
      title = result.title;
    } else if (host.includes("mp.weixin.qq.com")) {
      const result = await fetchWeixinContent(url);
      content = result.content;
      source = "weixin";
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

// 小红书内容抓取
async function fetchXiaohongshuContent(url: string): Promise<{ content: string; title: string }> {
  try {
    // 小红书有严格的反爬，尝试获取基本信息
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const html = await res.text();

      // 尝试提取标题
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/ - 小红书$/, "").trim() : "";

      // 尝试从 JSON-LD 或 meta 标签提取描述
      const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ||
                        html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
      const description = descMatch ? descMatch[1] : "";

      // 尝试提取作者
      const authorMatch = html.match(/<meta\s+name="author"\s+content="([^"]+)"/i);
      const author = authorMatch ? authorMatch[1] : "";

      if (title || description) {
        return {
          content: `来源: 小红书\n作者: ${author || "Unknown"}\n标题: ${title}\n\n${description}\n\n---\n⚠️ 小红书内容受限，建议手动复制完整内容`,
          title: title || "小红书笔记",
        };
      }
    }
  } catch (e) {
    console.error("Xiaohongshu fetch failed:", e);
  }

  return {
    content: `小红书链接: ${url}\n\n⚠️ 小红书内容需要登录才能查看\n请打开链接，手动复制笔记内容粘贴到下方\n\n建议复制:\n- 标题\n- 正文内容\n- 评论区精华`,
    title: "小红书笔记",
  };
}

// 抖音内容抓取
async function fetchDouyinContent(url: string): Promise<{ content: string; title: string }> {
  try {
    // 处理短链接
    let finalUrl = url;
    if (url.includes("v.douyin.com")) {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
      });
      finalUrl = res.url;
    }

    const res = await fetch(finalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const html = await res.text();

      // 提取标题
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/ - 抖音$/, "").trim() : "";

      // 提取描述
      const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      const description = descMatch ? descMatch[1] : "";

      if (title || description) {
        return {
          content: `来源: 抖音\n标题: ${title}\n\n${description}\n\n---\n⚠️ 抖音视频内容需要手动转录\n建议: 使用抖音的"复制链接"功能，然后手动输入视频中的关键信息`,
          title: title || "抖音视频",
        };
      }
    }
  } catch (e) {
    console.error("Douyin fetch failed:", e);
  }

  return {
    content: `抖音链接: ${url}\n\n⚠️ 抖音视频内容无法直接获取文字\n请手动输入:\n- 视频标题/描述\n- 视频中的关键步骤或内容\n- 评论区有价值的补充`,
    title: "抖音视频",
  };
}

// B站内容抓取
async function fetchBilibiliContent(url: string, parsedUrl: URL): Promise<{ content: string; title: string }> {
  try {
    // 获取视频 BV 号
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const bvMatch = url.match(/BV[\w]+/i) || pathParts.find(p => p.startsWith("BV"));
    const bvid = bvMatch ? (typeof bvMatch === "string" ? bvMatch : bvMatch[0]) : null;

    if (bvid) {
      // 使用 B站 API 获取视频信息
      const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
      const res = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.bilibili.com",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0 && data.data) {
          const video = data.data;
          const title = video.title || "";
          const desc = video.desc || "";
          const owner = video.owner?.name || "";
          const tags = video.tag || "";

          return {
            content: `来源: B站视频\nUP主: ${owner}\n标题: ${title}\nBV号: ${bvid}\n\n简介:\n${desc}\n\n标签: ${tags}\n\n---\n💡 如需视频字幕内容，建议:\n1. 打开视频，开启 CC 字幕\n2. 使用"一键三连"获取完整字幕\n3. 或手动总结视频要点`,
            title,
          };
        }
      }
    }

    // 尝试获取专栏文章
    if (url.includes("/read/")) {
      const cvMatch = url.match(/cv(\d+)/);
      if (cvMatch) {
        const cvid = cvMatch[1];
        const articleUrl = `https://api.bilibili.com/x/article/viewinfo?id=${cvid}`;
        const res = await fetch(articleUrl, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.code === 0 && data.data) {
            return {
              content: `来源: B站专栏\n标题: ${data.data.title}\n作者: ${data.data.author_name}\n\n请打开链接复制专栏正文内容`,
              title: data.data.title,
            };
          }
        }
      }
    }
  } catch (e) {
    console.error("Bilibili fetch failed:", e);
  }

  return {
    content: `B站链接: ${url}\n\n请手动复制:\n- 视频标题和简介\n- 视频要点内容\n- 有价值的弹幕或评论`,
    title: "B站内容",
  };
}

// 知乎内容抓取
async function fetchZhihuContent(url: string, parsedUrl: URL): Promise<{ content: string; title: string }> {
  try {
    const pathname = parsedUrl.pathname;

    // 知乎问答
    if (pathname.includes("/question/") && pathname.includes("/answer/")) {
      const answerMatch = pathname.match(/\/answer\/(\d+)/);
      if (answerMatch) {
        const answerId = answerMatch[1];
        // 知乎 API 需要认证，尝试网页抓取
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "text/html",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const html = await res.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].replace(/ - 知乎$/, "").trim() : "";

          return {
            content: `来源: 知乎回答\n问题: ${title}\n回答ID: ${answerId}\n\n请打开链接复制完整回答内容`,
            title,
          };
        }
      }
    }

    // 知乎专栏
    if (pathname.includes("/p/")) {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace(/ - 知乎$/, "").trim() : "";

        // 尝试提取正文
        const contentMatch = html.match(/<div class="RichText[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        let content = "";
        if (contentMatch) {
          content = contentMatch[1]
            .replace(/<[^>]+>/g, "\n")
            .replace(/\n\s*\n/g, "\n\n")
            .trim()
            .slice(0, 5000);
        }

        return {
          content: `来源: 知乎专栏\n标题: ${title}\n\n${content || "请打开链接复制文章内容"}`,
          title,
        };
      }
    }
  } catch (e) {
    console.error("Zhihu fetch failed:", e);
  }

  return {
    content: `知乎链接: ${url}\n\n请手动复制:\n- 问题/文章标题\n- 回答/文章正文\n- 高赞评论`,
    title: "知乎内容",
  };
}

// 微博内容抓取
async function fetchWeiboContent(url: string): Promise<{ content: string; title: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const html = await res.text();

      // 尝试提取微博内容
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";

      const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      const description = descMatch ? descMatch[1] : "";

      if (title || description) {
        return {
          content: `来源: 微博\n\n${title}\n\n${description}`,
          title: title || "微博",
        };
      }
    }
  } catch (e) {
    console.error("Weibo fetch failed:", e);
  }

  return {
    content: `微博链接: ${url}\n\n⚠️ 微博内容需要登录查看\n请手动复制:\n- 微博正文\n- 博主信息\n- 热门评论`,
    title: "微博",
  };
}

// 微信公众号内容抓取
async function fetchWeixinContent(url: string): Promise<{ content: string; title: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const html = await res.text();

      // 提取标题
      const titleMatch = html.match(/<h1[^>]*class="rich_media_title"[^>]*>([\s\S]*?)<\/h1>/i) ||
                         html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";

      // 提取作者/公众号名
      const authorMatch = html.match(/<span[^>]*class="rich_media_meta_nickname"[^>]*>([^<]+)<\/span>/i) ||
                          html.match(/<a[^>]*id="js_name"[^>]*>([^<]+)<\/a>/i);
      const author = authorMatch ? authorMatch[1].trim() : "";

      // 提取正文
      const contentMatch = html.match(/<div[^>]*class="rich_media_content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      let content = "";
      if (contentMatch) {
        content = contentMatch[1]
          .replace(/<[^>]+>/g, "\n")
          .replace(/&nbsp;/g, " ")
          .replace(/\n\s*\n/g, "\n\n")
          .trim()
          .slice(0, 8000);
      }

      if (title || content) {
        return {
          content: `来源: 微信公众号\n公众号: ${author}\n标题: ${title}\n\n${content || "请打开链接复制文章内容"}`,
          title,
        };
      }
    }
  } catch (e) {
    console.error("Weixin fetch failed:", e);
  }

  return {
    content: `微信公众号链接: ${url}\n\n请手动复制:\n- 文章标题\n- 文章正文\n- 公众号名称`,
    title: "微信公众号文章",
  };
}
