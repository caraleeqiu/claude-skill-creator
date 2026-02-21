// OpenClaw Skill Generator - 生成 OpenClaw 格式的 Skill
// 支持 Claude ↔ OpenClaw 格式互转

import type { SkillSpec, GeneratedSkill } from "./skill-generator";

export interface OpenClawSkill {
  name: string;
  description: string;
  version: string;
  author?: string;
  triggers: string[];
  commands?: {
    name: string;
    description: string;
    handler: string;
  }[];
  hooks?: {
    event: string;
    handler: string;
  }[];
  config?: Record<string, {
    type: string;
    description: string;
    default?: string | number | boolean;
  }>;
  dependencies?: string[];
  readme: string;
  skillTs: string;
  category: string;
  tags: string[];
}

// 将 Claude Skill Spec 转换为 OpenClaw 格式
export function convertToOpenClaw(spec: SkillSpec & { codeBlocks?: { language: string; code: string }[] }): OpenClawSkill {
  const { name, description, category, triggers, workflow } = spec;

  // 生成 skill.ts 代码
  const skillTs = generateSkillTs(name, description, workflow, spec.codeBlocks);

  // 生成 README
  const readme = generateOpenClawReadme(name, description, workflow, triggers);

  // 生成 commands
  const commands = triggers
    .filter(t => t.startsWith("/"))
    .map(t => ({
      name: t.replace("/", ""),
      description: `执行 ${name} 的 ${t} 命令`,
      handler: `handle${capitalize(t.replace("/", ""))}`,
    }));

  return {
    name,
    description: description.slice(0, 200),
    version: "1.0.0",
    triggers,
    commands: commands.length > 0 ? commands : undefined,
    readme,
    skillTs,
    category,
    tags: generateTags(name, description, category),
  };
}

// 将 OpenClaw Skill 转换回 Claude 格式
export function convertToClaude(openclawSkill: OpenClawSkill): GeneratedSkill {
  const { name, description, category, triggers, commands, readme } = openclawSkill;

  // 从 commands 提取步骤
  const steps = commands?.map(cmd => cmd.description) || ["执行任务"];

  // 构建 YAML frontmatter
  const frontmatter = `---
name: ${name}
description: ${description.replace(/\n/g, " ").slice(0, 200)}
---`;

  // 生成触发说明
  const triggerSection = triggers.length > 0
    ? `## 触发条件

当用户满足以下条件时激活此 Skill：
${triggers.map(t => `- ${t}`).join("\n")}`
    : "";

  // 生成工作流程
  const workflowSection = `## 工作流程

请按照以下步骤执行：

### 执行步骤
${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;

  const skillMd = `${frontmatter}

# ${formatName(name)}

${description}

${triggerSection}

${workflowSection}

## 注意事项

- 执行前确认用户意图
- 处理可能的错误情况
- 提供清晰的执行反馈
`.trim();

  return {
    name,
    skillMd,
    readme,
    category,
    tags: openclawSkill.tags,
    structure: {
      hasScripts: false,
      hasReferences: false,
      files: ["SKILL.md"],
    },
  };
}

// 生成 skill.ts 代码
function generateSkillTs(
  name: string,
  description: string,
  workflow: SkillSpec["workflow"],
  codeBlocks?: { language: string; code: string }[]
): string {
  const className = toPascalCase(name);

  // 从代码块中提取可用的代码片段
  const relevantCode = codeBlocks
    ?.filter(b => ["typescript", "javascript", "ts", "js"].includes(b.language))
    .map(b => b.code)
    .join("\n\n") || "";

  return `// ${name} - OpenClaw Skill
// ${description}

import { Skill, Message, Context } from "openclaw/plugin-sdk";

export class ${className}Skill implements Skill {
  name = "${name}";
  description = "${description.replace(/"/g, '\\"').slice(0, 100)}";

  triggers = [
    "/${name}",
    "${name}",
  ];

  async handle(message: Message, context: Context): Promise<string> {
    const { content } = message;

    // 解析用户输入
    const userInput = this.parseInput(content);

    try {
      // 执行主要逻辑
      const result = await this.execute(userInput, context);
      return this.formatOutput(result);
    } catch (error) {
      return \`执行失败: \${error instanceof Error ? error.message : "未知错误"}\`;
    }
  }

  private parseInput(content: string): Record<string, string> {
    // 移除触发词
    const cleaned = content.replace(new RegExp(\`^/\${this.name}\\\\s*\`, "i"), "").trim();
    return { raw: cleaned };
  }

  private async execute(input: Record<string, string>, context: Context): Promise<unknown> {
    // TODO: 实现核心逻辑
    /*
    工作流程:
${workflow.steps.map((s, i) => `    ${i + 1}. ${s}`).join("\n")}
    */

${relevantCode ? `    // 参考代码:\n    ${relevantCode.split("\n").map(l => `// ${l}`).join("\n    ")}` : ""}

    return {
      success: true,
      message: "任务完成",
      data: input,
    };
  }

  private formatOutput(result: unknown): string {
    if (typeof result === "string") return result;
    return JSON.stringify(result, null, 2);
  }
}

export default ${className}Skill;
`;
}

// 生成 OpenClaw README
function generateOpenClawReadme(
  name: string,
  description: string,
  workflow: SkillSpec["workflow"],
  triggers: string[]
): string {
  return `# ${formatName(name)}

${description}

## 安装

\`\`\`bash
# 使用 OpenClaw CLI 安装
openclaw plugin install ${name}

# 或手动安装
git clone https://github.com/YOUR_USERNAME/${name}.git ~/.openclaw/plugins/${name}
cd ~/.openclaw/plugins/${name}
npm install
\`\`\`

## 使用

在 OpenClaw 中使用以下命令：

${triggers.map(t => `- \`${t}\``).join("\n")}

## 工作流程

${workflow.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## 输入

${workflow.inputs.map(i => `- ${i}`).join("\n")}

## 输出

${workflow.outputs.map(o => `- ${o}`).join("\n")}

## 配置

在 \`~/.openclaw/config.yaml\` 中添加：

\`\`\`yaml
plugins:
  ${name}:
    enabled: true
\`\`\`

## 许可证

MIT
`;
}

function formatName(name: string): string {
  return name
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function generateTags(name: string, description: string, category: string): string[] {
  const tags = new Set([category, "openclaw-skill", "openclaw-plugin"]);

  // 从描述中提取关键词
  const keywords = description.match(/[a-zA-Z\u4e00-\u9fa5]{2,10}/g) || [];
  keywords.slice(0, 3).forEach(k => tags.add(k.toLowerCase()));

  return [...tags];
}

// 检测内容是 Claude 格式还是 OpenClaw 格式
export function detectSkillFormat(content: string): "claude" | "openclaw" | "unknown" {
  // Claude 格式特征
  if (content.includes("---\nname:") || content.includes("## 触发条件") || content.includes("## 工作流程")) {
    return "claude";
  }

  // OpenClaw 格式特征
  if (
    content.includes("openclaw/plugin-sdk") ||
    content.includes("implements Skill") ||
    content.includes("openclaw plugin install")
  ) {
    return "openclaw";
  }

  return "unknown";
}

// 智能转换 - 自动检测并转换格式
export function autoConvert(
  content: string,
  targetFormat: "claude" | "openclaw"
): { success: boolean; result?: GeneratedSkill | OpenClawSkill; error?: string } {
  const sourceFormat = detectSkillFormat(content);

  if (sourceFormat === "unknown") {
    return { success: false, error: "无法识别原格式，请确保是有效的 Claude 或 OpenClaw Skill" };
  }

  if (sourceFormat === targetFormat) {
    return { success: false, error: `内容已经是 ${targetFormat} 格式` };
  }

  // Claude → OpenClaw
  if (sourceFormat === "claude" && targetFormat === "openclaw") {
    try {
      const spec = parseClaudeSkillMd(content);
      const result = convertToOpenClaw(spec);
      return { success: true, result };
    } catch (e) {
      return { success: false, error: `转换失败: ${e instanceof Error ? e.message : "未知错误"}` };
    }
  }

  // OpenClaw → Claude
  if (sourceFormat === "openclaw" && targetFormat === "claude") {
    try {
      const openclawSkill = parseOpenClawSkill(content);
      const result = convertToClaude(openclawSkill);
      return { success: true, result };
    } catch (e) {
      return { success: false, error: `转换失败: ${e instanceof Error ? e.message : "未知错误"}` };
    }
  }

  return { success: false, error: "转换失败" };
}

// 解析 Claude SKILL.md
function parseClaudeSkillMd(content: string): SkillSpec {
  // 解析 YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  let name = "unknown";
  let description = "";

  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1];
    const nameMatch = yaml.match(/name:\s*(.+)/);
    const descMatch = yaml.match(/description:\s*(.+)/);
    if (nameMatch) name = nameMatch[1].trim();
    if (descMatch) description = descMatch[1].trim();
  }

  // 提取触发条件
  const triggers: string[] = [];
  const triggerMatch = content.match(/##\s*触发条件[\s\S]*?(?=##|$)/);
  if (triggerMatch) {
    const triggerLines = triggerMatch[0].match(/^-\s+(.+)$/gm);
    if (triggerLines) {
      triggers.push(...triggerLines.map(l => l.replace(/^-\s+/, "")));
    }
  }

  // 提取步骤
  const steps: string[] = [];
  const stepsMatch = content.match(/###\s*执行步骤[\s\S]*?(?=###|##|$)/);
  if (stepsMatch) {
    const stepLines = stepsMatch[0].match(/^\d+\.\s+(.+)$/gm);
    if (stepLines) {
      steps.push(...stepLines.map(l => l.replace(/^\d+\.\s+/, "")));
    }
  }

  return {
    name,
    description,
    category: "other",
    triggers: triggers.length > 0 ? triggers : [`/${name}`],
    workflow: {
      inputs: ["用户请求"],
      steps: steps.length > 0 ? steps : ["执行任务"],
      outputs: ["处理结果"],
    },
    resources: {
      needsScripts: false,
      needsReferences: false,
      suggestedScripts: [],
      suggestedReferences: [],
    },
    freedom: "medium",
  };
}

// 解析 OpenClaw Skill
function parseOpenClawSkill(content: string): OpenClawSkill {
  // 提取类名
  const classMatch = content.match(/class\s+(\w+)Skill/);
  const name = classMatch ? classMatch[1].toLowerCase().replace(/skill$/i, "") : "unknown";

  // 提取描述
  const descMatch = content.match(/description\s*=\s*["']([^"']+)["']/);
  const description = descMatch ? descMatch[1] : "";

  // 提取触发词
  const triggersMatch = content.match(/triggers\s*=\s*\[([\s\S]*?)\]/);
  const triggers: string[] = [];
  if (triggersMatch) {
    const triggerStr = triggersMatch[1];
    const triggerItems = triggerStr.match(/["']([^"']+)["']/g);
    if (triggerItems) {
      triggers.push(...triggerItems.map(t => t.replace(/["']/g, "")));
    }
  }

  return {
    name,
    description,
    version: "1.0.0",
    triggers: triggers.length > 0 ? triggers : [`/${name}`],
    readme: `# ${name}\n\n${description}`,
    skillTs: content,
    category: "other",
    tags: ["openclaw-skill"],
  };
}
