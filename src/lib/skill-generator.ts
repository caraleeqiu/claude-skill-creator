// Skill Generator - 根据自然语言描述生成 SKILL.md

interface SkillInput {
  description: string; // 用户的自然语言描述
  name?: string;       // 可选的 skill 名称
}

interface GeneratedSkill {
  name: string;
  skillMd: string;
  readme: string;
  category: string;
  tags: string[];
}

// 从描述中提取关键信息
function extractSkillInfo(description: string): {
  name: string;
  purpose: string;
  triggers: string[];
  steps: string[];
  category: string;
} {
  const desc = description.toLowerCase();

  // 提取可能的名称
  const nameMatch = description.match(/(?:叫|名为|called|named)\s*["""']?([a-z0-9-]+)["""']?/i);
  let name = nameMatch?.[1] || "";

  if (!name) {
    // 从关键词生成名称
    const keywords = desc.match(/(?:帮我|help me|create|make|build|生成|创建)\s+(\w+)/);
    name = keywords?.[1] || "my-skill";
  }

  // 识别类别
  let category = "other";
  if (/git|code|dev|开发|代码|调试|debug|test/.test(desc)) category = "dev-tools";
  else if (/自动|automat|workflow|流程|batch|批量/.test(desc)) category = "automation";
  else if (/写|write|文章|blog|content|内容|seo/.test(desc)) category = "content";
  else if (/效率|todo|task|项目|project|manage/.test(desc)) category = "productivity";
  else if (/数据|data|分析|csv|json|sql|excel/.test(desc)) category = "data";
  else if (/设计|design|ui|css|样式|figma/.test(desc)) category = "design";
  else if (/消息|message|slack|discord|邮件|email|通知/.test(desc)) category = "communication";

  // 提取触发词
  const triggers: string[] = [];
  const triggerPatterns = [
    /当.*?时/g,
    /如果.*?就/g,
    /when.*?then/gi,
    /whenever/gi,
  ];
  for (const pattern of triggerPatterns) {
    const matches = description.match(pattern);
    if (matches) triggers.push(...matches);
  }

  // 添加基于描述的默认触发词
  if (triggers.length === 0) {
    triggers.push(`"${name}"`, `"/${name}"`);
  }

  // 提取步骤
  const steps: string[] = [];
  const stepPatterns = [
    /(\d+[.、)]\s*.+)/g,
    /首先(.+?)然后/g,
    /first(.+?)then/gi,
  ];
  for (const pattern of stepPatterns) {
    const matches = description.match(pattern);
    if (matches) steps.push(...matches);
  }

  return {
    name: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    purpose: description,
    triggers,
    steps,
    category,
  };
}

export function generateSkillFromDescription(input: SkillInput): GeneratedSkill {
  const info = extractSkillInfo(input.description);
  const name = input.name || info.name || "my-skill";

  // 生成 SKILL.md
  const skillMd = `---
name: ${name}
description: ${input.description.slice(0, 200)}${input.description.length > 200 ? "..." : ""}
---

# ${name}

${input.description}

## 触发条件 (When to Use)

当用户提到以下关键词或场景时自动激活：
${info.triggers.map(t => `- ${t}`).join("\n")}

## 执行步骤 (Steps)

${info.steps.length > 0
  ? info.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
  : `1. 分析用户的需求
2. 收集必要的信息
3. 执行核心任务
4. 验证结果并输出`}

## 示例 (Examples)

\`\`\`
用户: [示例输入]
Claude: [根据 skill 执行相应操作]
结果: [预期输出]
\`\`\`

## 注意事项

- 确保在执行前确认用户意图
- 处理可能的错误情况
- 提供清晰的执行反馈
`;

  // 生成 README.md
  const readme = `# ${name}

${input.description}

## 安装

\`\`\`bash
# 方式 1: 直接克隆
git clone https://github.com/YOUR_USERNAME/${name}.git ~/.claude/skills/${name}

# 方式 2: 手动创建
mkdir -p ~/.claude/skills/${name}
# 将 SKILL.md 复制到该目录
\`\`\`

## 使用

在 Claude Code 中使用 \`/${name}\` 或描述相关需求即可自动触发。

## 类别

${info.category}

## License

MIT
`;

  // 生成标签
  const tags = [info.category, "claude-skill", "claude-code"];
  const keywordTags = input.description.match(/[a-zA-Z\u4e00-\u9fa5]{2,10}/g) || [];
  tags.push(...keywordTags.slice(0, 3));

  return {
    name,
    skillMd,
    readme,
    category: info.category,
    tags: [...new Set(tags)],
  };
}

// 验证 skill 格式
export function validateSkillMd(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查 frontmatter
  if (!content.startsWith("---")) {
    errors.push("缺少 YAML frontmatter (必须以 --- 开头)");
  }

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    errors.push("YAML frontmatter 格式不正确");
  } else {
    const frontmatter = frontmatterMatch[1];
    if (!frontmatter.includes("name:")) {
      errors.push("缺少 name 字段");
    }
    if (!frontmatter.includes("description:")) {
      errors.push("缺少 description 字段");
    }
  }

  // 检查命名规则
  const nameMatch = content.match(/name:\s*([^\n]+)/);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    if (!/^[a-z0-9-]+$/.test(name)) {
      errors.push("name 必须是 kebab-case (小写字母、数字、连字符)");
    }
    if (name.includes("claude") || name.includes("anthropic")) {
      errors.push("name 不能包含 'claude' 或 'anthropic'");
    }
  }

  // 检查是否包含 XML 标签
  if (/<[a-z]+[^>]*>/i.test(content)) {
    errors.push("不建议使用 XML 标签 (防止 prompt injection)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
