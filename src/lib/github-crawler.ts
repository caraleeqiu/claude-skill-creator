import { Octokit } from "@octokit/rest";
import type { Skill } from "@/types/skill";

// ============ Claude Code Skills ============
const CLAUDE_SKILL_TOPICS = [
  "claude-skills",
  "claude-code-skill",
  "claude-code-skills",
  "agent-skills",
];

const CLAUDE_SKILL_COLLECTIONS = [
  { owner: "anthropics", repo: "skills", skillsPath: "skills", platform: "claude" as const },
  { owner: "vercel-labs", repo: "agent-skills", skillsPath: "skills", platform: "claude" as const },
  { owner: "vercel-labs", repo: "next-skills", skillsPath: "skills", platform: "claude" as const },
  { owner: "cloudflare", repo: "skills", skillsPath: "skills", platform: "claude" as const },
  { owner: "supabase", repo: "agent-skills", skillsPath: "skills", platform: "claude" as const },
  { owner: "huggingface", repo: "skills", skillsPath: "skills", platform: "claude" as const },
  { owner: "stripe", repo: "ai", skillsPath: "skills", platform: "claude" as const },
  { owner: "google-labs-code", repo: "stitch-skills", skillsPath: "skills", platform: "claude" as const },
];

// ============ OpenClaw Plugins ============
const OPENCLAW_TOPICS = [
  "openclaw",
  "openclaw-plugin",
  "openclaw-skill",
  "openclaw-extension",
];

const OPENCLAW_COLLECTIONS = [
  { owner: "openclaw", repo: "openclaw", skillsPath: "extensions", platform: "openclaw" as const },
  // 可以添加更多 OpenClaw 相关仓库
];

// ============ Awesome Lists ============
const AWESOME_LISTS: { repo: string; platform: "claude" | "openclaw" | "both" }[] = [
  { repo: "VoltAgent/awesome-agent-skills", platform: "both" },
  { repo: "travisvn/awesome-claude-skills", platform: "claude" },
  { repo: "ComposioHQ/awesome-claude-skills", platform: "claude" },
  { repo: "libukai/awesome-agent-skills", platform: "both" },
];

// ============ Social Media Search Terms ============
const SOCIAL_SEARCH_TERMS = [
  // Claude Code
  "claude code skill",
  "claude skill tutorial",
  "claude code workflow",
  "claude code automation",
  // OpenClaw
  "openclaw plugin",
  "openclaw skill",
  "openclaw tutorial",
  // General AI Agent
  "ai agent skill",
  "llm automation",
];

// Rate limit handler
async function withRateLimit<T>(fn: () => Promise<T>, retries = 3): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      const error = e as { status?: number; message?: string };
      if (error.status === 403 && error.message?.includes("rate limit")) {
        console.log(`Rate limited, waiting ${(i + 1) * 5}s...`);
        await new Promise((r) => setTimeout(r, (i + 1) * 5000));
      } else if (error.status === 404) {
        return null;
      } else {
        throw e;
      }
    }
  }
  return null;
}

export interface CrawlOptions {
  includeClaude?: boolean;
  includeOpenClaw?: boolean;
  includeSocial?: boolean;
  token?: string;
}

export async function crawlGitHubSkills(token?: string, options?: CrawlOptions): Promise<Skill[]> {
  const octokit = new Octokit({ auth: token });
  const skills: Skill[] = [];
  const seen = new Set<string>();

  const opts = {
    includeClaude: true,
    includeOpenClaw: true,
    includeSocial: false,  // 社交媒体默认关闭（需要额外 API）
    ...options,
  };

  console.log("Starting skill crawl...");
  console.log(`Platforms: Claude=${opts.includeClaude}, OpenClaw=${opts.includeOpenClaw}, Social=${opts.includeSocial}`);

  // ============ 1. Claude Code Skills ============
  if (opts.includeClaude) {
    // 1a. Crawl Claude skill collections
    for (const collection of CLAUDE_SKILL_COLLECTIONS) {
      console.log(`[Claude] Crawling ${collection.owner}/${collection.repo}...`);
      const collectionSkills = await crawlSkillCollection(
        octokit,
        collection.owner,
        collection.repo,
        collection.skillsPath,
        seen,
        "claude"
      );
      skills.push(...collectionSkills);
    }

    // 1b. Crawl Claude topics
    for (const topic of CLAUDE_SKILL_TOPICS) {
      const topicSkills = await crawlByTopic(octokit, topic, seen, "claude");
      skills.push(...topicSkills);
    }
  }

  // ============ 2. OpenClaw Plugins ============
  if (opts.includeOpenClaw) {
    // 2a. Crawl OpenClaw collections
    for (const collection of OPENCLAW_COLLECTIONS) {
      console.log(`[OpenClaw] Crawling ${collection.owner}/${collection.repo}...`);
      const collectionSkills = await crawlOpenClawCollection(
        octokit,
        collection.owner,
        collection.repo,
        collection.skillsPath,
        seen
      );
      skills.push(...collectionSkills);
    }

    // 2b. Crawl OpenClaw topics
    for (const topic of OPENCLAW_TOPICS) {
      const topicSkills = await crawlByTopic(octokit, topic, seen, "openclaw");
      skills.push(...topicSkills);
    }
  }

  // ============ 3. Awesome Lists ============
  for (const list of AWESOME_LISTS) {
    // 根据平台过滤
    if (list.platform === "claude" && !opts.includeClaude) continue;
    if (list.platform === "openclaw" && !opts.includeOpenClaw) continue;

    console.log(`Parsing awesome list: ${list.repo}...`);
    const [owner, repo] = list.repo.split("/");

    const readmeContent = await withRateLimit(async () => {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: "README.md",
      });
      if ("content" in data) {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      return null;
    });

    if (readmeContent) {
      const skillLinks = extractSkillLinks(readmeContent);

      for (const link of skillLinks) {
        const skillKey = `${link.owner}/${link.repo}/${link.path}`;
        if (seen.has(skillKey)) continue;
        seen.add(skillKey);

        const skill = await fetchSkillFromPath(
          octokit,
          link.owner,
          link.repo,
          link.path,
          link.name,
          link.description,
          list.platform
        );
        if (skill) skills.push(skill);
      }
    }
  }

  // ============ 4. Social Media (X/Twitter, Reddit) ============
  if (opts.includeSocial) {
    console.log("Crawling social media sources...");
    const socialSkills = await crawlSocialMedia();
    skills.push(...socialSkills);
  }

  // Sort by stars (if available) then by name
  skills.sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));

  console.log(`Crawl complete. Found ${skills.length} skills.`);
  return skills;
}

// 按 topic 搜索
async function crawlByTopic(
  octokit: Octokit,
  topic: string,
  seen: Set<string>,
  platform: "claude" | "openclaw"
): Promise<Skill[]> {
  const skills: Skill[] = [];

  const result = await withRateLimit(async () => {
    const { data } = await octokit.search.repos({
      q: `topic:${topic}`,
      sort: "stars",
      order: "desc",
      per_page: 30,
    });
    return data;
  });

  if (result) {
    for (const repo of result.items) {
      if (!repo.owner) continue;

      // Claude: 检查 SKILL.md
      // OpenClaw: 检查 package.json 或 skill.ts
      const key = `${repo.full_name}`;
      if (seen.has(key)) continue;

      if (platform === "claude") {
        const hasSkillMd = await withRateLimit(async () => {
          await octokit.repos.getContent({
            owner: repo.owner!.login,
            repo: repo.name,
            path: "SKILL.md",
          });
          return true;
        });

        if (hasSkillMd) {
          seen.add(key);
          const skill = await fetchSkillFromPath(
            octokit,
            repo.owner.login,
            repo.name,
            "",
            repo.name,
            repo.description || "",
            "claude"
          );
          if (skill) skills.push(skill);
        }
      } else {
        // OpenClaw: 检查是否是插件
        const isOpenClawPlugin = await checkOpenClawPlugin(octokit, repo.owner.login, repo.name);
        if (isOpenClawPlugin) {
          seen.add(key);
          skills.push({
            id: `${repo.owner.login}-${repo.name}`.replace(/[^a-zA-Z0-9-]/g, "-"),
            name: repo.name,
            description: repo.description || `OpenClaw plugin by ${repo.owner.login}`,
            author: repo.owner.login,
            repo_url: `https://github.com/${repo.owner.login}/${repo.name}`,
            stars: repo.stargazers_count || 0,
            category: categorizeSkill(repo.name, repo.description || "", []),
            tags: [repo.owner.login, "openclaw"],
            skill_md_url: `https://github.com/${repo.owner.login}/${repo.name}`,
            created_at: repo.created_at || new Date().toISOString(),
            updated_at: repo.updated_at || new Date().toISOString(),
            platform: "openclaw",
            source: "github",
          });
        }
      }
    }
  }

  return skills;
}

// 检查是否是 OpenClaw 插件
async function checkOpenClawPlugin(octokit: Octokit, owner: string, repo: string): Promise<boolean> {
  // 检查 package.json 中是否有 openclaw 依赖
  const pkgJson = await withRateLimit(async () => {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: "package.json",
    });
    if ("content" in data) {
      return JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    }
    return null;
  });

  if (pkgJson) {
    const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies, ...pkgJson.peerDependencies };
    if (deps && (deps.openclaw || deps["openclaw/plugin-sdk"])) {
      return true;
    }
  }

  return false;
}

// 爬取 OpenClaw extensions 目录
async function crawlOpenClawCollection(
  octokit: Octokit,
  owner: string,
  repo: string,
  extensionsPath: string,
  seen: Set<string>
): Promise<Skill[]> {
  const skills: Skill[] = [];

  // Get repo info
  const repoInfo = await withRateLimit(async () => {
    const { data } = await octokit.repos.get({ owner, repo });
    return data;
  });

  // List subdirectories
  const contents = await withRateLimit(async () => {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: extensionsPath,
    });
    return data;
  });

  if (!contents || !Array.isArray(contents)) return skills;

  for (const item of contents) {
    if (item.type !== "dir") continue;

    const skillKey = `${owner}/${repo}/${extensionsPath}/${item.name}`;
    if (seen.has(skillKey)) continue;
    seen.add(skillKey);

    // 读取 package.json 获取描述
    const pkgJson = await withRateLimit(async () => {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: `${extensionsPath}/${item.name}/package.json`,
      });
      if ("content" in data) {
        return JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
      }
      return null;
    });

    const description = pkgJson?.description || `${item.name} OpenClaw extension`;
    const category = categorizeSkill(item.name, description, []);

    skills.push({
      id: `${owner}-${repo}-${item.name}`,
      name: item.name,
      description,
      author: owner,
      repo_url: `https://github.com/${owner}/${repo}/tree/main/${extensionsPath}/${item.name}`,
      stars: repoInfo?.stargazers_count || 0,
      category,
      tags: [owner, "openclaw", "extension"],
      skill_md_url: `https://github.com/${owner}/${repo}/tree/main/${extensionsPath}/${item.name}`,
      created_at: repoInfo?.created_at || new Date().toISOString(),
      updated_at: repoInfo?.updated_at || new Date().toISOString(),
      platform: "openclaw",
      source: "github",
    });
  }

  return skills;
}

// 社交媒体爬取 (X/Twitter, Reddit)
async function crawlSocialMedia(): Promise<Skill[]> {
  const skills: Skill[] = [];

  // 注意：需要相应的 API key
  // 这里提供框架，实际使用需要配置

  // 1. X/Twitter 搜索
  // 需要 Twitter API v2 Bearer Token
  if (process.env.TWITTER_BEARER_TOKEN) {
    try {
      const twitterSkills = await searchTwitterSkills();
      skills.push(...twitterSkills);
    } catch (e) {
      console.error("Twitter crawl failed:", e);
    }
  }

  // 2. Reddit 搜索
  // Reddit API 是公开的，可以直接搜索
  try {
    const redditSkills = await searchRedditSkills();
    skills.push(...redditSkills);
  } catch (e) {
    console.error("Reddit crawl failed:", e);
  }

  return skills;
}

// Twitter/X 搜索
async function searchTwitterSkills(): Promise<Skill[]> {
  const skills: Skill[] = [];
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) return skills;

  for (const query of SOCIAL_SEARCH_TERMS.slice(0, 3)) {
    try {
      const response = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=created_at,author_id,public_metrics`,
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          for (const tweet of data.data) {
            // 检查是否包含 GitHub 链接
            const githubMatch = tweet.text.match(/github\.com\/([^/\s]+)\/([^/\s]+)/);
            if (githubMatch) {
              skills.push({
                id: `twitter-${tweet.id}`,
                name: `${githubMatch[2]}`,
                description: tweet.text.slice(0, 200),
                author: `@${tweet.author_id}`,
                repo_url: `https://github.com/${githubMatch[1]}/${githubMatch[2]}`,
                stars: tweet.public_metrics?.like_count || 0,
                category: "other",
                tags: ["twitter", "community"],
                skill_md_url: `https://twitter.com/i/web/status/${tweet.id}`,
                created_at: tweet.created_at,
                updated_at: tweet.created_at,
                platform: "both",
                source: "twitter",
                source_url: `https://twitter.com/i/web/status/${tweet.id}`,
              });
            }
          }
        }
      }
    } catch (e) {
      console.error(`Twitter search failed for "${query}":`, e);
    }
  }

  return skills;
}

// Reddit 搜索
async function searchRedditSkills(): Promise<Skill[]> {
  const skills: Skill[] = [];

  // 搜索相关 subreddits
  const subreddits = ["ClaudeAI", "LocalLLaMA", "artificial", "MachineLearning"];

  for (const subreddit of subreddits) {
    for (const query of SOCIAL_SEARCH_TERMS.slice(0, 2)) {
      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&limit=5&sort=top&t=month`,
          {
            headers: {
              "User-Agent": "ClaudeSkillCreator/1.0",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data?.children) {
            for (const post of data.data.children) {
              const postData = post.data;
              // 检查是否包含 GitHub 链接
              const text = `${postData.title} ${postData.selftext || ""}`;
              const githubMatch = text.match(/github\.com\/([^/\s]+)\/([^/\s)]+)/);

              if (githubMatch) {
                skills.push({
                  id: `reddit-${postData.id}`,
                  name: githubMatch[2].replace(/[^\w-]/g, ""),
                  description: postData.title.slice(0, 200),
                  author: postData.author,
                  repo_url: `https://github.com/${githubMatch[1]}/${githubMatch[2]}`,
                  stars: postData.score || 0,
                  category: "other",
                  tags: ["reddit", subreddit, "community"],
                  skill_md_url: `https://reddit.com${postData.permalink}`,
                  created_at: new Date(postData.created_utc * 1000).toISOString(),
                  updated_at: new Date(postData.created_utc * 1000).toISOString(),
                  platform: "both",
                  source: "reddit",
                  source_url: `https://reddit.com${postData.permalink}`,
                });
              }
            }
          }
        }
      } catch (e) {
        console.error(`Reddit search failed for r/${subreddit}:`, e);
      }
    }
  }

  return skills;
}

// Crawl a repository that contains multiple skills in subdirectories
async function crawlSkillCollection(
  octokit: Octokit,
  owner: string,
  repo: string,
  skillsPath: string,
  seen: Set<string>,
  platform: "claude" | "openclaw" | "both" = "claude"
): Promise<Skill[]> {
  const skills: Skill[] = [];

  // Get repo info for stars
  const repoInfo = await withRateLimit(async () => {
    const { data } = await octokit.repos.get({ owner, repo });
    return data;
  });

  // List subdirectories in skills folder
  const contents = await withRateLimit(async () => {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: skillsPath,
    });
    return data;
  });

  if (!contents || !Array.isArray(contents)) return skills;

  for (const item of contents) {
    if (item.type !== "dir") continue;

    const skillKey = `${owner}/${repo}/${skillsPath}/${item.name}`;
    if (seen.has(skillKey)) continue;
    seen.add(skillKey);

    // Check for SKILL.md in this subdirectory
    const skillMdPath = `${skillsPath}/${item.name}/SKILL.md`;
    const skillContent = await withRateLimit(async () => {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: skillMdPath,
      });
      if ("content" in data) {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      return null;
    });

    if (skillContent) {
      const description = extractDescriptionFromSkillMd(skillContent);
      const category = categorizeSkill(item.name, description, []);

      skills.push({
        id: `${owner}-${repo}-${item.name}`,
        name: item.name,
        description: description || `${item.name} skill by ${owner}`,
        author: owner,
        repo_url: `https://github.com/${owner}/${repo}/tree/main/${skillsPath}/${item.name}`,
        stars: repoInfo?.stargazers_count || 0,
        category,
        tags: [owner, "official"],
        skill_md_url: `https://github.com/${owner}/${repo}/blob/main/${skillMdPath}`,
        created_at: repoInfo?.created_at || new Date().toISOString(),
        updated_at: repoInfo?.updated_at || new Date().toISOString(),
        platform,
        source: "github",
      });
    }
  }

  return skills;
}

// Extract skill links from awesome list README
interface SkillLink {
  owner: string;
  repo: string;
  path: string;
  name: string;
  description: string;
}

function extractSkillLinks(content: string): SkillLink[] {
  const links: SkillLink[] = [];

  // Match patterns like: **[owner/skill-name](https://github.com/owner/repo/tree/main/skills/skill-name)** - Description
  // Or: - **[name](url)** - description
  const pattern = /\*\*\[([^\]]+)\]\((https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/[^/]+\/([^)]+))\)\*\*\s*[-–]\s*([^\n]+)/g;

  let match;
  while ((match = pattern.exec(content)) !== null) {
    const [, name, , owner, repo, path, description] = match;

    // Skip non-skill paths
    if (path.includes("commands") || path.includes("template")) continue;

    links.push({
      owner,
      repo,
      path: path.replace(/\/$/, ""),
      name: name.split("/").pop() || name,
      description: description.trim(),
    });
  }

  // Also match simpler patterns
  const simplePattern = /[-*]\s*\[([^\]]+)\]\((https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/[^/]+\/([^)]+))\)/g;

  while ((match = simplePattern.exec(content)) !== null) {
    const [, name, , owner, repo, path] = match;

    // Skip if already added or non-skill paths
    const key = `${owner}/${repo}/${path}`;
    if (links.some(l => `${l.owner}/${l.repo}/${l.path}` === key)) continue;
    if (path.includes("commands") || path.includes("template")) continue;

    links.push({
      owner,
      repo,
      path: path.replace(/\/$/, ""),
      name: name.split("/").pop() || name,
      description: "",
    });
  }

  return links;
}

// Fetch a skill from a specific path in a repo
async function fetchSkillFromPath(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  name: string,
  description: string,
  platform: "claude" | "openclaw" | "both" = "claude"
): Promise<Skill | null> {
  // Get repo info
  const repoInfo = await withRateLimit(async () => {
    const { data } = await octokit.repos.get({ owner, repo });
    return data;
  });

  // Determine SKILL.md path
  const skillMdPath = path ? `${path}/SKILL.md` : "SKILL.md";

  // Fetch SKILL.md content
  const skillContent = await withRateLimit(async () => {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: skillMdPath,
    });
    if ("content" in data) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  });

  if (!skillContent) return null;

  const extractedDesc = extractDescriptionFromSkillMd(skillContent);
  const finalDescription = description || extractedDesc || `${name} skill`;
  const category = categorizeSkill(name, finalDescription, []);
  const skillName = path ? path.split("/").pop() || name : name;

  return {
    id: `${owner}-${repo}-${skillName}`.replace(/[^a-zA-Z0-9-]/g, "-"),
    name: skillName,
    description: finalDescription,
    author: owner,
    repo_url: path
      ? `https://github.com/${owner}/${repo}/tree/main/${path}`
      : `https://github.com/${owner}/${repo}`,
    stars: repoInfo?.stargazers_count || 0,
    category,
    tags: [owner],
    skill_md_url: `https://github.com/${owner}/${repo}/blob/main/${skillMdPath}`,
    created_at: repoInfo?.created_at || new Date().toISOString(),
    updated_at: repoInfo?.updated_at || new Date().toISOString(),
    platform,
    source: "github",
  };
}

// Extract description from SKILL.md content
function extractDescriptionFromSkillMd(content: string): string {
  // Try to get from YAML frontmatter
  const yamlMatch = content.match(/^---\n[\s\S]*?description:\s*([^\n]+)/);
  if (yamlMatch) {
    return yamlMatch[1].trim().replace(/^["']|["']$/g, "");
  }

  // Try to get first paragraph after title
  const lines = content.split("\n");
  let foundTitle = false;
  for (const line of lines) {
    if (line.startsWith("#")) {
      foundTitle = true;
      continue;
    }
    if (foundTitle && line.trim() && !line.startsWith("#") && !line.startsWith("-") && !line.startsWith("*")) {
      return line.trim().slice(0, 200);
    }
  }

  return "";
}

function categorizeSkill(
  name: string,
  description: string,
  topics: string[]
): string {
  const text = `${name} ${description} ${topics.join(" ")}`.toLowerCase();

  if (/git|code|dev|build|test|debug|lint|format|refactor|compile|sdk|cli|upgrade/.test(text)) {
    return "dev-tools";
  }
  if (/automat|workflow|pipeline|ci|cd|cron|schedule|batch|deploy/.test(text)) {
    return "automation";
  }
  if (/content|write|blog|article|seo|copy|draft|edit|translate|doc|paper/.test(text)) {
    return "content";
  }
  if (/product|task|project|todo|manage|plan|org|calendar|track/.test(text)) {
    return "productivity";
  }
  if (/data|analys|csv|json|sql|excel|parse|transform|etl|postgres|database/.test(text)) {
    return "data";
  }
  if (/design|ui|ux|figma|css|style|theme|visual|layout|art|canvas|react|frontend/.test(text)) {
    return "design";
  }
  if (/slack|discord|email|chat|message|notify|telegram|whatsapp|gif/.test(text)) {
    return "communication";
  }

  return "other";
}

export async function fetchSkillContent(
  repoUrl: string,
  token?: string
): Promise<string | null> {
  const octokit = new Octokit({ auth: token });

  // Handle both repo URLs and tree URLs
  const treeMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/[^/]+\/(.+)/);
  const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

  if (treeMatch) {
    const [, owner, repo, path] = treeMatch;
    const result = await withRateLimit(async () => {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: `${path}/SKILL.md`,
      });
      if ("content" in data) {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      return null;
    });
    return result;
  }

  if (repoMatch) {
    const [, owner, repo] = repoMatch;
    const result = await withRateLimit(async () => {
      const { data } = await octokit.repos.getContent({
        owner,
        repo: repo.replace(/\.git$/, ""),
        path: "SKILL.md",
      });
      if ("content" in data) {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      return null;
    });
    return result;
  }

  return null;
}

// Get detailed skill info including README
export async function getSkillDetails(
  repoUrl: string,
  token?: string
): Promise<{
  skillMd: string | null;
  readme: string | null;
  files: string[];
} | null> {
  const octokit = new Octokit({ auth: token });

  // Handle tree URLs
  const treeMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/[^/]+\/(.+)/);
  const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

  let owner: string, repo: string, basePath = "";

  if (treeMatch) {
    [, owner, repo, basePath] = treeMatch;
  } else if (repoMatch) {
    [, owner, repo] = repoMatch;
    repo = repo.replace(/\.git$/, "");
  } else {
    return null;
  }

  try {
    // Get file list
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: basePath,
    });

    const files = Array.isArray(contents)
      ? contents.map((f) => f.name)
      : [contents.name];

    // Get SKILL.md
    let skillMd: string | null = null;
    if (files.includes("SKILL.md")) {
      skillMd = await fetchSkillContent(repoUrl, token);
    }

    // Get README
    let readme: string | null = null;
    const readmeFile = files.find((f) => /^readme\.md$/i.test(f));
    if (readmeFile) {
      const result = await withRateLimit(async () => {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: basePath ? `${basePath}/${readmeFile}` : readmeFile,
        });
        if ("content" in data) {
          return Buffer.from(data.content, "base64").toString("utf-8");
        }
        return null;
      });
      readme = result;
    }

    return { skillMd, readme, files };
  } catch {
    return null;
  }
}
