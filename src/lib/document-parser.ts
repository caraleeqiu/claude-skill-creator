// Document Parser - 从文档/帖子/经验中提取 Skill 信息
// 支持 Markdown、纯文本、帖子内容

export interface ParsedDocument {
  title: string;
  summary: string;
  steps: string[];
  triggers: string[];
  inputs: string[];
  outputs: string[];
  codeBlocks: {
    language: string;
    code: string;
  }[];
  tips: string[];
  warnings: string[];
  category: string;
  confidence: number; // 0-1 解析置信度
}

// 从文档内容中提取 Skill 相关信息
export function parseDocument(content: string): ParsedDocument {
  const lines = content.split("\n");

  // 提取标题
  const title = extractTitle(content);

  // 提取摘要
  const summary = extractSummary(content);

  // 提取步骤
  const steps = extractSteps(content);

  // 提取触发条件
  const triggers = extractTriggers(content);

  // 提取输入输出
  const { inputs, outputs } = extractInputsOutputs(content);

  // 提取代码块
  const codeBlocks = extractCodeBlocks(content);

  // 提取提示和警告
  const tips = extractTips(content);
  const warnings = extractWarnings(content);

  // 检测分类
  const category = detectCategory(content);

  // 计算置信度
  const confidence = calculateConfidence({ steps, triggers, codeBlocks });

  return {
    title,
    summary,
    steps,
    triggers,
    inputs,
    outputs,
    codeBlocks,
    tips,
    warnings,
    category,
    confidence,
  };
}

function extractTitle(content: string): string {
  // Markdown 标题
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  // 首行作为标题
  const firstLine = content.split("\n")[0]?.trim();
  if (firstLine && firstLine.length < 100) return firstLine;

  return "未命名 Skill";
}

function extractSummary(content: string): string {
  // 移除标题后的第一段
  const lines = content.split("\n");
  let inParagraph = false;
  const paragraphLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // 跳过标题
    if (trimmed.startsWith("#")) {
      if (paragraphLines.length > 0) break;
      continue;
    }
    // 跳过代码块
    if (trimmed.startsWith("```")) {
      if (paragraphLines.length > 0) break;
      continue;
    }
    // 收集段落
    if (trimmed) {
      inParagraph = true;
      paragraphLines.push(trimmed);
    } else if (inParagraph) {
      break;
    }
  }

  return paragraphLines.join(" ").slice(0, 300);
}

function extractSteps(content: string): string[] {
  const steps: string[] = [];

  // 匹配各种步骤格式
  const patterns = [
    // 数字编号: 1. 2. 3. 或 1) 2) 3)
    /^\s*(\d+)[.、)]\s*(.+)$/gm,
    // 中文编号: 第一步 第二步
    /^\s*第[一二三四五六七八九十\d]+步[：:]\s*(.+)$/gm,
    // Step 1: Step 2:
    /^\s*(?:step|步骤)\s*\d+[：:]\s*(.+)$/gim,
    // 无序列表（可能是步骤）
    /^\s*[-•*]\s+(?:首先|然后|接着|最后|之后|再|接下来)(.+)$/gm,
  ];

  // 数字编号
  const numberedMatches = content.matchAll(/^\s*(\d+)[.、)]\s*(.+)$/gm);
  for (const match of numberedMatches) {
    const step = match[2].trim();
    if (step.length > 5 && step.length < 200) {
      steps.push(step);
    }
  }

  // 如果没有找到编号步骤，尝试找关键词步骤
  if (steps.length === 0) {
    const keywordMatches = content.matchAll(/^\s*[-•*]\s+((?:首先|然后|接着|最后|之后|再|接下来).+)$/gm);
    for (const match of keywordMatches) {
      steps.push(match[1].trim());
    }
  }

  // 从小标题提取
  if (steps.length === 0) {
    const headingMatches = content.matchAll(/^##\s+(.+)$/gm);
    for (const match of headingMatches) {
      const heading = match[1].trim();
      // 过滤掉常见的非步骤标题
      if (!/^(介绍|简介|概述|总结|参考|附录|背景)/i.test(heading)) {
        steps.push(heading);
      }
    }
  }

  return steps.slice(0, 10); // 最多 10 个步骤
}

function extractTriggers(content: string): string[] {
  const triggers: string[] = [];
  const lowerContent = content.toLowerCase();

  // 匹配触发条件的模式
  const patterns = [
    /当(.{5,50})时/g,
    /如果(.{5,50})就/g,
    /每次(.{5,50})都/g,
    /whenever\s+(.{10,100})/gi,
    /when\s+(?:you|user|i)\s+(.{10,100})/gi,
    /用于(.{5,50})/g,
    /适合(.{5,50})/g,
  ];

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const trigger = match[1]?.trim();
      if (trigger && trigger.length > 3 && trigger.length < 100) {
        triggers.push(trigger);
      }
    }
  }

  // 如果没有找到明确的触发条件，尝试从标题或首段推断
  if (triggers.length === 0) {
    const title = extractTitle(content);
    if (title.includes("如何") || title.includes("怎么") || title.includes("how to")) {
      triggers.push(`用户想要${title.replace(/^(如何|怎么|how to\s*)/i, "")}`);
    }
  }

  return [...new Set(triggers)].slice(0, 5);
}

function extractInputsOutputs(content: string): { inputs: string[]; outputs: string[] } {
  const inputs: string[] = [];
  const outputs: string[] = [];

  // 输入模式
  const inputPatterns = [
    /(?:输入|input|参数|parameter)[：:]\s*(.+)/gi,
    /需要(?:提供|准备|输入)\s*(.+)/g,
    /接收\s*(.+)\s*作为输入/g,
  ];

  for (const pattern of inputPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const input = match[1]?.trim();
      if (input && input.length < 100) {
        inputs.push(input);
      }
    }
  }

  // 输出模式
  const outputPatterns = [
    /(?:输出|output|返回|生成)[：:]\s*(.+)/gi,
    /(?:会|将)(?:生成|创建|输出|返回)\s*(.+)/g,
    /最终(?:得到|获得)\s*(.+)/g,
  ];

  for (const pattern of outputPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const output = match[1]?.trim();
      if (output && output.length < 100) {
        outputs.push(output);
      }
    }
  }

  return {
    inputs: [...new Set(inputs)].slice(0, 5),
    outputs: [...new Set(outputs)].slice(0, 5),
  };
}

function extractCodeBlocks(content: string): { language: string; code: string }[] {
  const codeBlocks: { language: string; code: string }[] = [];

  // Markdown 代码块
  const codeBlockPattern = /```(\w*)\n([\s\S]*?)```/g;
  const matches = content.matchAll(codeBlockPattern);

  for (const match of matches) {
    codeBlocks.push({
      language: match[1] || "text",
      code: match[2].trim(),
    });
  }

  return codeBlocks;
}

function extractTips(content: string): string[] {
  const tips: string[] = [];

  // 匹配提示
  const tipPatterns = [
    /(?:提示|tip|注意|note)[：:]\s*(.+)/gi,
    /(?:💡|🔔|✨)\s*(.+)/g,
    /(?:建议|推荐)[：:]\s*(.+)/gi,
  ];

  for (const pattern of tipPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const tip = match[1]?.trim();
      if (tip && tip.length < 200) {
        tips.push(tip);
      }
    }
  }

  return tips.slice(0, 5);
}

function extractWarnings(content: string): string[] {
  const warnings: string[] = [];

  // 匹配警告
  const warningPatterns = [
    /(?:警告|warning|注意|caution)[：:]\s*(.+)/gi,
    /(?:⚠️|🚨|❗)\s*(.+)/g,
    /不要(.{5,100})/g,
    /避免(.{5,100})/g,
  ];

  for (const pattern of warningPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const warning = match[1]?.trim();
      if (warning && warning.length < 200) {
        warnings.push(warning);
      }
    }
  }

  return warnings.slice(0, 5);
}

function detectCategory(content: string): string {
  const lowerContent = content.toLowerCase();

  const categories: Record<string, RegExp> = {
    "dev-tools": /git|code|dev|开发|代码|调试|debug|test|api|sdk|部署|deploy|npm|docker|ci|cd/,
    "automation": /自动|automat|workflow|流程|batch|批量|cron|schedule|定时|脚本/,
    "content": /写|write|文章|blog|content|内容|seo|copywriting|文案|排版/,
    "productivity": /效率|todo|task|项目|project|manage|计划|plan|时间管理/,
    "data": /数据|data|分析|csv|json|sql|excel|统计|报表|可视化/,
    "design": /设计|design|ui|css|样式|figma|sketch|图片|图像/,
    "communication": /消息|message|slack|discord|邮件|email|通知|notify|聊天/,
    "ai": /ai|ml|llm|gpt|claude|机器学习|深度学习|神经网络|模型/,
  };

  for (const [cat, pattern] of Object.entries(categories)) {
    if (pattern.test(lowerContent)) return cat;
  }

  return "other";
}

function calculateConfidence(data: {
  steps: string[];
  triggers: string[];
  codeBlocks: { language: string; code: string }[];
}): number {
  let score = 0;

  // 有步骤 +0.3
  if (data.steps.length > 0) score += 0.3;
  if (data.steps.length >= 3) score += 0.1;

  // 有触发条件 +0.2
  if (data.triggers.length > 0) score += 0.2;

  // 有代码块 +0.2
  if (data.codeBlocks.length > 0) score += 0.2;

  // 步骤数量合理 +0.2
  if (data.steps.length >= 2 && data.steps.length <= 8) score += 0.2;

  return Math.min(score, 1);
}

// 将解析结果转换为 SkillSpec
export function parsedDocumentToSpec(
  parsed: ParsedDocument,
  options: { name?: string; platform?: "claude" | "openclaw" } = {}
): {
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
  platform: "claude" | "openclaw";
  codeBlocks: { language: string; code: string }[];
  tips: string[];
  warnings: string[];
} {
  const name = options.name ||
    parsed.title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) ||
    "my-skill";

  const hasScripts = parsed.codeBlocks.some(
    (block) => ["bash", "sh", "python", "javascript", "typescript"].includes(block.language)
  );

  return {
    name,
    description: parsed.summary || parsed.title,
    category: parsed.category,
    triggers: parsed.triggers.length > 0 ? parsed.triggers : [`/${name}`],
    workflow: {
      inputs: parsed.inputs.length > 0 ? parsed.inputs : ["用户请求"],
      steps: parsed.steps.length > 0 ? parsed.steps : [
        "分析用户需求",
        "执行任务",
        "返回结果",
      ],
      outputs: parsed.outputs.length > 0 ? parsed.outputs : ["处理结果"],
    },
    resources: {
      needsScripts: hasScripts,
      needsReferences: parsed.codeBlocks.length > 2,
      suggestedScripts: hasScripts ? [`scripts/${name}.sh`] : [],
      suggestedReferences: parsed.tips.length > 0 ? [`references/${name}_guide.md`] : [],
    },
    freedom: parsed.steps.length > 5 ? "low" : parsed.steps.length > 2 ? "medium" : "high",
    platform: options.platform || "claude",
    codeBlocks: parsed.codeBlocks,
    tips: parsed.tips,
    warnings: parsed.warnings,
  };
}
