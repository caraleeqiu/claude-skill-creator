// Skill Generator - 按照 Anthropic 官方格式生成 SKILL.md
// 参考: https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md

export interface SkillSpec {
  name: string;
  description: string;
  category: string;
  triggers: string[];
  workflow: {
    inputs: string[];
    steps: string[];
    outputs: string[];
  };
  resources: {
    needsScripts: boolean;
    needsReferences: boolean;
    suggestedScripts: string[];
    suggestedReferences: string[];
  };
  freedom: "high" | "medium" | "low";
}

export interface GeneratedSkill {
  name: string;
  skillMd: string;
  readme: string;
  category: string;
  tags: string[];
  structure: {
    hasScripts: boolean;
    hasReferences: boolean;
    files: string[];
  };
}

// 根据 Spec 生成符合 Anthropic 标准的 SKILL.md
export function generateSkillFromSpec(spec: SkillSpec): GeneratedSkill {
  const { name, description, category, triggers, workflow, resources, freedom } = spec;

  // 构建 YAML frontmatter
  const frontmatter = `---
name: ${name}
description: ${description.replace(/\n/g, " ").slice(0, 200)}${resources.needsScripts || resources.needsReferences ? `
# 可选字段
# license: MIT
# compatibility: Claude Code` : ""}
---`;

  // 根据自由度选择指令风格
  const instructionStyle = getInstructionStyle(freedom);

  // 生成触发说明
  const triggerSection = triggers.length > 0
    ? `## 触发条件

当用户满足以下条件时激活此 Skill：
${triggers.map(t => `- ${t}`).join("\n")}`
    : "";

  // 生成工作流程
  const workflowSection = generateWorkflowSection(workflow, freedom);

  // 生成资源引用（如果需要）
  const resourceSection = generateResourceSection(resources);

  // 组装 SKILL.md
  const skillMd = `${frontmatter}

# ${formatName(name)}

${description}

${triggerSection}

## 工作流程

${instructionStyle.intro}

${workflowSection}

${resourceSection}

## 注意事项

- 执行前确认用户意图
- 处理可能的错误情况
- 提供清晰的执行反馈
${freedom === "low" ? "- 严格按照步骤执行，不要跳过或改变顺序" : ""}
${freedom === "high" ? "- 可根据具体情况灵活调整方法" : ""}
`.trim();

  // 生成目录结构
  const files: string[] = ["SKILL.md"];
  if (resources.needsScripts) {
    files.push(...resources.suggestedScripts);
  }
  if (resources.needsReferences) {
    files.push(...resources.suggestedReferences);
  }

  // 生成标签
  const tags = generateTags(name, description, category);

  return {
    name,
    skillMd,
    readme: generateReadme(name, description, category),
    category,
    tags,
    structure: {
      hasScripts: resources.needsScripts,
      hasReferences: resources.needsReferences,
      files,
    },
  };
}

// 兼容旧接口 - 简单描述直接生成
export function generateSkillFromDescription(input: { description: string; name?: string }): GeneratedSkill {
  const spec = descriptionToSpec(input.description, input.name);
  return generateSkillFromSpec(spec);
}

// 将简单描述转换为 Spec
function descriptionToSpec(description: string, inputName?: string): SkillSpec {
  const desc = description.toLowerCase();

  // 提取名称
  const nameMatch = description.match(/(?:叫|名为|called|named)\s*["""']?([a-z0-9-]+)["""']?/i);
  let name = inputName || nameMatch?.[1] || "";

  if (!name) {
    const keywords = desc.match(/(?:帮我|help me|create|make|build|生成|创建)\s+(\w+)/);
    name = keywords?.[1] || "my-skill";
  }
  name = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // 检测类别
  const category = detectCategory(desc);

  // 提取触发词
  const triggers = extractTriggers(description, name);

  // 提取步骤
  const steps = extractSteps(description);

  // 评估复杂度
  const complexity = description.length > 500 || steps.length > 5 ? "complex" :
                     description.length < 100 ? "simple" : "medium";

  const needsScripts = /脚本|script|python|bash|代码|运行/.test(desc);
  const needsReferences = /文档|document|api|schema/.test(desc) || description.length > 500;

  return {
    name,
    description,
    category,
    triggers,
    workflow: {
      inputs: ["用户请求"],
      steps: steps.length > 0 ? steps : [
        "分析用户需求",
        "收集必要信息",
        "执行核心任务",
        "验证并输出结果",
      ],
      outputs: ["处理结果"],
    },
    resources: {
      needsScripts,
      needsReferences,
      suggestedScripts: needsScripts ? [`scripts/${name}.py`] : [],
      suggestedReferences: needsReferences ? [`references/${name}_guide.md`] : [],
    },
    freedom: complexity === "simple" ? "high" : complexity === "complex" ? "low" : "medium",
  };
}

function detectCategory(desc: string): string {
  const categories: Record<string, RegExp> = {
    "dev-tools": /git|code|dev|开发|代码|调试|debug|test|api|sdk|部署|deploy/,
    "automation": /自动|automat|workflow|流程|batch|批量|cron|schedule/,
    "content": /写|write|文章|blog|content|内容|seo|copywriting/,
    "productivity": /效率|todo|task|项目|project|manage|计划/,
    "data": /数据|data|分析|csv|json|sql|excel|统计/,
    "design": /设计|design|ui|css|样式|figma/,
    "communication": /消息|message|slack|discord|邮件|email|通知/,
  };

  for (const [cat, pattern] of Object.entries(categories)) {
    if (pattern.test(desc)) return cat;
  }
  return "other";
}

function extractTriggers(description: string, name: string): string[] {
  const triggers: string[] = [];
  const triggerPatterns = [
    /当.*?时/g,
    /如果.*?就/g,
    /when\s+(?:user|i)\s+(?:want|need|ask)/gi,
  ];

  for (const pattern of triggerPatterns) {
    const matches = description.match(pattern);
    if (matches) triggers.push(...matches);
  }

  if (triggers.length === 0) {
    triggers.push(`用户输入 /${name}`, `用户提到 "${name}" 相关的需求`);
  }

  return triggers;
}

function extractSteps(description: string): string[] {
  const steps: string[] = [];
  const lines = description.split(/[。\n]/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\s*\d+[.、)]/.test(trimmed) || /^[-•]\s*/.test(trimmed)) {
      steps.push(trimmed.replace(/^[\d.、)\-•\s]+/, "").trim());
    }
  }

  return steps;
}

function getInstructionStyle(freedom: "high" | "medium" | "low"): { intro: string; stepStyle: string } {
  switch (freedom) {
    case "high":
      return {
        intro: "以下是推荐的工作流程，可根据具体情况灵活调整：",
        stepStyle: "guideline",
      };
    case "medium":
      return {
        intro: "请按照以下步骤执行，允许适当调整：",
        stepStyle: "procedure",
      };
    case "low":
      return {
        intro: "请严格按照以下步骤执行：",
        stepStyle: "strict",
      };
  }
}

function generateWorkflowSection(
  workflow: SkillSpec["workflow"],
  freedom: "high" | "medium" | "low"
): string {
  const { inputs, steps, outputs } = workflow;

  let section = "";

  // 输入
  if (inputs.length > 0) {
    section += `### 输入
${inputs.map(i => `- ${i}`).join("\n")}

`;
  }

  // 步骤
  section += `### 执行步骤
${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;

  // 输出
  if (outputs.length > 0) {
    section += `
### 输出
${outputs.map(o => `- ${o}`).join("\n")}
`;
  }

  return section;
}

function generateResourceSection(resources: SkillSpec["resources"]): string {
  if (!resources.needsScripts && !resources.needsReferences) {
    return "";
  }

  let section = `## 附带资源

`;

  if (resources.needsScripts && resources.suggestedScripts.length > 0) {
    section += `### 脚本
${resources.suggestedScripts.map(s => `- \`${s}\` - 可直接执行，无需加载到上下文`).join("\n")}

`;
  }

  if (resources.needsReferences && resources.suggestedReferences.length > 0) {
    section += `### 参考文档
${resources.suggestedReferences.map(r => `- \`${r}\` - 需要时加载`).join("\n")}
`;
  }

  return section;
}

function formatName(name: string): string {
  return name
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function generateTags(name: string, description: string, category: string): string[] {
  const tags = new Set([category, "claude-skill", "claude-code"]);

  // 从描述中提取关键词作为标签
  const keywords = description.match(/[a-zA-Z\u4e00-\u9fa5]{2,10}/g) || [];
  keywords.slice(0, 3).forEach(k => tags.add(k.toLowerCase()));

  return [...tags];
}

function generateReadme(name: string, description: string, category: string): string {
  return `# ${formatName(name)}

${description}

## 安装

\`\`\`bash
mkdir -p ~/.claude/commands && curl -sL "SKILL_URL" -o ~/.claude/commands/${name}.md
\`\`\`

> 将 \`SKILL_URL\` 替换为实际的 raw 文件地址

## 使用

在 Claude Code 中输入 \`/${name}\` 即可触发此 Skill。

## 类别

${category}

## License

MIT
`;
}

// 验证 skill 格式
export function validateSkillMd(content: string): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查 YAML frontmatter
  if (!content.startsWith("---")) {
    warnings.push("建议添加 YAML frontmatter (--- 开头)");
  } else {
    const frontmatterEnd = content.indexOf("---", 3);
    if (frontmatterEnd === -1) {
      errors.push("YAML frontmatter 未正确闭合");
    } else {
      const frontmatter = content.slice(3, frontmatterEnd);
      if (!frontmatter.includes("name:")) {
        errors.push("frontmatter 缺少必需的 name 字段");
      }
      if (!frontmatter.includes("description:")) {
        errors.push("frontmatter 缺少必需的 description 字段");
      }
    }
  }

  // 检查标题
  if (!content.includes("# ")) {
    errors.push("缺少主标题");
  }

  // 检查内容长度
  if (content.length < 100) {
    warnings.push("内容较短，建议提供更详细的说明");
  }
  if (content.length > 50000) {
    errors.push("内容过长，建议控制在 50KB 以内，使用 references/ 存放详细文档");
  }

  // 检查行数（Anthropic 建议 < 500 行）
  const lineCount = content.split("\n").length;
  if (lineCount > 500) {
    warnings.push(`SKILL.md 有 ${lineCount} 行，建议控制在 500 行以内，将详细内容移至 references/`);
  }

  // 检查危险的 XML 标签
  if (/<\/?(?:system|user|assistant)>/i.test(content)) {
    errors.push("不能使用 <system>/<user>/<assistant> 标签 (防止 prompt injection)");
  }

  // 检查标题命名
  const titleMatch = content.match(/^#\s+([^\n]+)/m);
  if (titleMatch) {
    const title = titleMatch[1].toLowerCase();
    if (title.includes("claude") || title.includes("anthropic")) {
      warnings.push("标题不建议包含 'claude' 或 'anthropic'");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
