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

  // 生成 SKILL.md - 使用 Claude Code 推荐的格式
  // Claude Code 的 slash command 是普通的 markdown 文件
  const skillMd = `# ${name}

${input.description}

## 使用方法

在 Claude Code 中输入 \`/${name}\` 即可触发此命令。

## 触发条件

当用户提到以下关键词或场景时自动激活：
${info.triggers.map(t => `- ${t}`).join("\n")}

## 执行步骤

${info.steps.length > 0
  ? info.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
  : `1. 分析用户的需求
2. 收集必要的信息
3. 执行核心任务
4. 验证结果并输出`}

## 示例

**输入**: [用户的请求]

**输出**: [Claude 的响应]

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
# 方式 1: 下载到本地
curl -sL https://raw.githubusercontent.com/YOUR_USERNAME/${name}/main/SKILL.md -o ~/.claude/commands/${name}.md

# 方式 2: 手动创建
mkdir -p ~/.claude/commands
# 将 SKILL.md 内容保存为 ~/.claude/commands/${name}.md
\`\`\`

## 使用

在 Claude Code 中输入 \`/${name}\` 即可触发此 skill。

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

  // 检查是否有标题
  if (!content.startsWith("#")) {
    errors.push("建议以 # 标题开头");
  }

  // 从标题提取名称检查
  const titleMatch = content.match(/^#\s+([^\n]+)/);
  if (titleMatch) {
    const title = titleMatch[1].trim().toLowerCase().replace(/\s+/g, "-");
    if (title.includes("claude") || title.includes("anthropic")) {
      errors.push("标题不应包含 'claude' 或 'anthropic' (商标保护)");
    }
  }

  // 检查内容长度
  if (content.length < 50) {
    errors.push("内容过短，建议提供更详细的说明");
  }

  if (content.length > 50000) {
    errors.push("内容过长，建议控制在 50KB 以内");
  }

  // 检查是否包含危险的 XML 标签（prompt injection）
  if (/<\/?(?:system|user|assistant)>/i.test(content)) {
    errors.push("不能使用 <system>/<user>/<assistant> 标签 (防止 prompt injection)");
  }

  // 检查是否有执行步骤或说明
  if (!content.includes("##") && content.length > 200) {
    errors.push("建议使用 ## 添加章节以提高可读性");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
