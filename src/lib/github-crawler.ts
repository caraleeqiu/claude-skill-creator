import { Octokit } from "@octokit/rest";
import type { Skill } from "@/types/skill";

// Topics to search
const SKILL_TOPICS = [
  "claude-skills",
  "claude-code-skill",
  "claude-code-skills",
  "agent-skills",
];

// Known high-quality skill repositories (contains multiple skills in subdirectories)
const SKILL_COLLECTIONS = [
  { owner: "anthropics", repo: "skills", skillsPath: "skills" },
  { owner: "vercel-labs", repo: "agent-skills", skillsPath: "skills" },
  { owner: "vercel-labs", repo: "next-skills", skillsPath: "skills" },
  { owner: "cloudflare", repo: "skills", skillsPath: "skills" },
  { owner: "supabase", repo: "agent-skills", skillsPath: "skills" },
  { owner: "huggingface", repo: "skills", skillsPath: "skills" },
  { owner: "stripe", repo: "ai", skillsPath: "skills" },
  { owner: "google-labs-code", repo: "stitch-skills", skillsPath: "skills" },
];

// Awesome lists to parse for more skills
const AWESOME_LISTS = [
  "VoltAgent/awesome-agent-skills",
  "travisvn/awesome-claude-skills",
  "ComposioHQ/awesome-claude-skills",
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

  // 1. Crawl known skill collections (repos with multiple skills in subdirectories)
  for (const collection of SKILL_COLLECTIONS) {
    console.log(`Crawling ${collection.owner}/${collection.repo}...`);
    const collectionSkills = await crawlSkillCollection(
      octokit,
      collection.owner,
      collection.repo,
      collection.skillsPath,
      seen
    );
    skills.push(...collectionSkills);
  }

  // 2. Parse awesome lists for skill links
  for (const listRepo of AWESOME_LISTS) {
    console.log(`Parsing awesome list: ${listRepo}...`);
    const [owner, repo] = listRepo.split("/");

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
          link.description
        );
        if (skill) skills.push(skill);
      }
    }
  }

  // 3. Crawl by topics (only repos with SKILL.md at root)
  for (const topic of SKILL_TOPICS) {
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
        const key = `${repo.full_name}/SKILL.md`;
        if (seen.has(key)) continue;

        // Check if has SKILL.md at root
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
            repo.description || ""
          );
          if (skill) skills.push(skill);
        }
      }
    }
  }

  // Sort by stars (if available) then by name
  skills.sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));

  console.log(`Crawl complete. Found ${skills.length} skills.`);
  return skills;
}

// Crawl a repository that contains multiple skills in subdirectories
async function crawlSkillCollection(
  octokit: Octokit,
  owner: string,
  repo: string,
  skillsPath: string,
  seen: Set<string>
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
  description: string
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
