import { Octokit } from "@octokit/rest";
import type { Skill } from "@/types/skill";

// Topics to search
const SKILL_TOPICS = [
  "claude-skills",
  "claude-code-skill",
  "claude-code-skills",
  "agent-skills",
  "claude-code",
];

// Keywords for search queries
const SEARCH_QUERIES = [
  "claude skill",
  "claude code skill",
  "SKILL.md claude",
  "agent skills claude",
];

// Known high-quality repos
const SKILL_REPOS = [
  "anthropics/skills",
  "travisvn/awesome-claude-skills",
  "alirezarezvani/claude-skills",
  "daymade/claude-code-skills",
  "ComposioHQ/awesome-claude-skills",
  "mhattingpete/claude-skills-marketplace",
  "netresearch/claude-code-marketplace",
  "VoltAgent/awesome-agent-skills",
  "libukai/awesome-agent-skills",
];

// Awesome lists to parse for more skills
const AWESOME_LISTS = [
  "travisvn/awesome-claude-skills",
  "ComposioHQ/awesome-claude-skills",
  "VoltAgent/awesome-agent-skills",
  "libukai/awesome-agent-skills",
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

export async function crawlGitHubSkills(token?: string): Promise<Skill[]> {
  const octokit = new Octokit({ auth: token });
  const skills: Skill[] = [];
  const seen = new Set<string>();

  console.log("Starting skill crawl...");

  // 1. Crawl by topics
  for (const topic of SKILL_TOPICS) {
    const result = await withRateLimit(async () => {
      const { data } = await octokit.search.repos({
        q: `topic:${topic}`,
        sort: "stars",
        order: "desc",
        per_page: 50,
      });
      return data;
    });

    if (result) {
      for (const repo of result.items) {
        if (!repo.owner || seen.has(repo.full_name)) continue;
        seen.add(repo.full_name);

        const skill = await extractSkillFromRepo(octokit, {
          full_name: repo.full_name,
          name: repo.name,
          description: repo.description,
          html_url: repo.html_url,
          stargazers_count: repo.stargazers_count,
          owner: { login: repo.owner.login },
          created_at: repo.created_at ?? new Date().toISOString(),
          updated_at: repo.updated_at ?? new Date().toISOString(),
          topics: repo.topics,
        });
        if (skill) skills.push(skill);
      }
    }
  }

  // 2. Crawl by search queries
  for (const query of SEARCH_QUERIES) {
    const result = await withRateLimit(async () => {
      const { data } = await octokit.search.repos({
        q: query,
        sort: "stars",
        order: "desc",
        per_page: 30,
      });
      return data;
    });

    if (result) {
      for (const repo of result.items) {
        if (!repo.owner || seen.has(repo.full_name)) continue;
        seen.add(repo.full_name);

        const skill = await extractSkillFromRepo(octokit, {
          full_name: repo.full_name,
          name: repo.name,
          description: repo.description,
          html_url: repo.html_url,
          stargazers_count: repo.stargazers_count,
          owner: { login: repo.owner.login },
          created_at: repo.created_at ?? new Date().toISOString(),
          updated_at: repo.updated_at ?? new Date().toISOString(),
          topics: repo.topics,
        });
        if (skill) skills.push(skill);
      }
    }
  }

  // 3. Crawl known repos
  for (const repoPath of SKILL_REPOS) {
    if (seen.has(repoPath)) continue;

    const result = await withRateLimit(async () => {
      const [owner, repo] = repoPath.split("/");
      const { data } = await octokit.repos.get({ owner, repo });
      return data;
    });

    if (result) {
      seen.add(repoPath);
      const skill = await extractSkillFromRepo(octokit, {
        full_name: result.full_name,
        name: result.name,
        description: result.description,
        html_url: result.html_url,
        stargazers_count: result.stargazers_count,
        owner: { login: result.owner.login },
        created_at: result.created_at ?? new Date().toISOString(),
        updated_at: result.updated_at ?? new Date().toISOString(),
        topics: result.topics,
      });
      if (skill) skills.push(skill);
    }
  }

  // 4. Parse awesome lists for more skills
  for (const listRepo of AWESOME_LISTS) {
    const [owner, repo] = listRepo.split("/");

    // Get README content
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
      // Extract GitHub repo links from README
      const repoLinks = extractGitHubLinks(readmeContent);

      for (const repoPath of repoLinks) {
        if (seen.has(repoPath)) continue;

        const [repoOwner, repoName] = repoPath.split("/");
        const result = await withRateLimit(async () => {
          const { data } = await octokit.repos.get({ owner: repoOwner, repo: repoName });
          return data;
        });

        if (result) {
          seen.add(repoPath);
          const skill = await extractSkillFromRepo(octokit, {
            full_name: result.full_name,
            name: result.name,
            description: result.description,
            html_url: result.html_url,
            stargazers_count: result.stargazers_count,
            owner: { login: result.owner.login },
            created_at: result.created_at ?? new Date().toISOString(),
            updated_at: result.updated_at ?? new Date().toISOString(),
            topics: result.topics,
          });
          if (skill) skills.push(skill);
        }
      }
    }
  }

  // Sort by stars
  skills.sort((a, b) => b.stars - a.stars);

  console.log(`Crawl complete. Found ${skills.length} skills.`);
  return skills;
}

// Extract GitHub repository links from markdown content
function extractGitHubLinks(content: string): string[] {
  const links: string[] = [];

  // Match GitHub repo URLs
  const patterns = [
    /https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/g,
    /\[([^\]]+)\]\(https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)[^)]*\)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let owner: string, repo: string;

      if (match.length === 3) {
        // Direct URL match
        [, owner, repo] = match;
      } else if (match.length === 4) {
        // Markdown link match
        [, , owner, repo] = match;
      } else {
        continue;
      }

      // Clean up repo name
      repo = repo.replace(/\.git$/, "").replace(/[#?].*$/, "");

      // Skip certain paths that aren't repos
      if (["issues", "pull", "blob", "tree", "wiki", "releases"].includes(repo)) {
        continue;
      }

      const repoPath = `${owner}/${repo}`;
      if (!links.includes(repoPath)) {
        links.push(repoPath);
      }
    }
  }

  return links;
}

async function extractSkillFromRepo(
  octokit: Octokit,
  repo: {
    full_name: string;
    name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    owner: { login: string };
    created_at: string;
    updated_at: string;
    topics?: string[];
  }
): Promise<Skill | null> {
  // Check for SKILL.md in common locations
  const paths = [
    "SKILL.md",
    "skills/SKILL.md",
    ".claude/skills/SKILL.md",
  ];

  let skillMdUrl = "";
  let hasSkillMd = false;

  for (const path of paths) {
    const result = await withRateLimit(async () => {
      await octokit.repos.getContent({
        owner: repo.owner.login,
        repo: repo.name,
        path,
      });
      return true;
    });

    if (result) {
      skillMdUrl = `${repo.html_url}/blob/main/${path}`;
      hasSkillMd = true;
      break;
    }
  }

  // Even without SKILL.md, include repos with relevant topics
  const hasRelevantTopic =
    repo.topics?.some((t) =>
      ["claude-skill", "claude-code", "agent-skills", "claude-skills"].includes(t)
    ) || false;

  if (!hasSkillMd && !hasRelevantTopic) {
    // Check if it's a known repo or has skill-related name
    const isKnownRepo = SKILL_REPOS.includes(repo.full_name);
    const hasSkillName = /skill|claude|agent/i.test(repo.name);
    if (!isKnownRepo && !hasSkillName) {
      return null;
    }
  }

  const category = categorizeSkill(
    repo.name,
    repo.description || "",
    repo.topics || []
  );

  return {
    id: repo.full_name.replace("/", "-"),
    name: repo.name,
    description: repo.description || "No description",
    author: repo.owner.login,
    repo_url: repo.html_url,
    stars: repo.stargazers_count,
    category,
    tags: repo.topics || [],
    skill_md_url: skillMdUrl,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
  };
}

function categorizeSkill(
  name: string,
  description: string,
  topics: string[]
): string {
  const text = `${name} ${description} ${topics.join(" ")}`.toLowerCase();

  // More comprehensive categorization
  if (/git|code|dev|build|test|debug|lint|format|refactor|compile/.test(text)) {
    return "dev-tools";
  }
  if (/automat|workflow|pipeline|ci|cd|cron|schedule|batch/.test(text)) {
    return "automation";
  }
  if (/content|write|blog|article|seo|copy|draft|edit|translate/.test(text)) {
    return "content";
  }
  if (/product|task|project|todo|manage|plan|org|calendar/.test(text)) {
    return "productivity";
  }
  if (/data|analys|csv|json|sql|excel|parse|transform|etl/.test(text)) {
    return "data";
  }
  if (/design|ui|ux|figma|css|style|theme|visual|layout/.test(text)) {
    return "design";
  }
  if (/slack|discord|email|chat|message|notify|telegram|whatsapp/.test(text)) {
    return "communication";
  }

  return "other";
}

export async function fetchSkillContent(
  repoUrl: string,
  token?: string
): Promise<string | null> {
  const octokit = new Octokit({ auth: token });

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  const [, owner, repo] = match;

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

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  const [, owner, repoName] = match;
  const repo = repoName.replace(/\.git$/, "");

  try {
    // Get file list
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: "",
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
          path: readmeFile,
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
