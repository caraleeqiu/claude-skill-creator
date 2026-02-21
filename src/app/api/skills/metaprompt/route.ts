import { NextResponse } from "next/server";

// Step 1: 生成 Metaprompt - 澄清 Skill 需求
export async function POST(request: Request) {
  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: "请提供 skill 的描述" },
        { status: 400 }
      );
    }

    // 分析用户描述，生成澄清问题
    const analysis = analyzeDescription(description);

    // 生成结构化的 Skill 规格说明
    const spec = generateSpec(description, analysis);

    // 生成需要用户确认/补充的问题
    const questions = generateClarifyingQuestions(analysis);

    return NextResponse.json({
      spec,
      questions,
      analysis,
    });
  } catch (error) {
    console.error("Error generating metaprompt:", error);
    return NextResponse.json(
      { error: "生成 metaprompt 失败" },
      { status: 500 }
    );
  }
}

interface DescriptionAnalysis {
  hasName: boolean;
  name: string;
  hasTriggers: boolean;
  triggers: string[];
  hasSteps: boolean;
  steps: string[];
  hasInputOutput: boolean;
  inputs: string[];
  outputs: string[];
  category: string;
  complexity: "simple" | "medium" | "complex";
  needsScripts: boolean;
  needsReferences: boolean;
}

function analyzeDescription(description: string): DescriptionAnalysis {
  const desc = description.toLowerCase();

  // 提取名称
  const nameMatch = description.match(/(?:叫|名为|called|named|skill\s*名?)\s*["""']?([a-z0-9-]+)["""']?/i);
  const name = nameMatch?.[1] || extractNameFromKeywords(desc);

  // 提取触发条件
  const triggers: string[] = [];
  const triggerPatterns = [
    /当.*?时/g,
    /如果.*?就/g,
    /when\s+(?:user|i)\s+(?:want|need|ask)/gi,
    /whenever/gi,
    /每次/g,
  ];
  for (const pattern of triggerPatterns) {
    const matches = description.match(pattern);
    if (matches) triggers.push(...matches);
  }

  // 提取步骤
  const steps: string[] = [];
  const lines = description.split(/[。\n]/);
  for (const line of lines) {
    if (/^\s*\d+[.、)]/.test(line) || /^[-•]\s*/.test(line)) {
      steps.push(line.trim());
    }
  }

  // 提取输入输出
  const inputs: string[] = [];
  const outputs: string[] = [];
  if (/输入|input|接收|读取|参数/.test(desc)) {
    const inputMatch = description.match(/(?:输入|input|接收|读取)\s*[:：]?\s*([^。\n]+)/i);
    if (inputMatch) inputs.push(inputMatch[1]);
  }
  if (/输出|output|生成|返回|创建/.test(desc)) {
    const outputMatch = description.match(/(?:输出|output|生成|返回|创建)\s*[:：]?\s*([^。\n]+)/i);
    if (outputMatch) outputs.push(outputMatch[1]);
  }

  // 识别类别
  const category = detectCategory(desc);

  // 评估复杂度
  const complexity = evaluateComplexity(description, steps);

  // 是否需要脚本
  const needsScripts = /脚本|script|python|bash|代码|execute|运行|命令/.test(desc) || complexity === "complex";

  // 是否需要参考文档
  const needsReferences = /文档|document|api|schema|规范|spec|reference/.test(desc) || description.length > 500;

  return {
    hasName: !!nameMatch,
    name,
    hasTriggers: triggers.length > 0,
    triggers,
    hasSteps: steps.length > 0,
    steps,
    hasInputOutput: inputs.length > 0 || outputs.length > 0,
    inputs,
    outputs,
    category,
    complexity,
    needsScripts,
    needsReferences,
  };
}

function extractNameFromKeywords(desc: string): string {
  const patterns = [
    /(?:帮我|help\s+me|create|make|build|生成|创建)\s+(?:a\s+)?(\w+)/i,
    /(\w+)\s*(?:skill|工具|助手)/i,
  ];
  for (const pattern of patterns) {
    const match = desc.match(pattern);
    if (match) return match[1].toLowerCase().replace(/\s+/g, "-");
  }
  return "my-skill";
}

function detectCategory(desc: string): string {
  const categories: Record<string, RegExp> = {
    "dev-tools": /git|code|dev|开发|代码|调试|debug|test|api|sdk|部署|deploy/,
    "automation": /自动|automat|workflow|流程|batch|批量|cron|schedule/,
    "content": /写|write|文章|blog|content|内容|seo|copywriting|文案/,
    "productivity": /效率|todo|task|项目|project|manage|计划|plan/,
    "data": /数据|data|分析|csv|json|sql|excel|统计|报表/,
    "design": /设计|design|ui|css|样式|figma|sketch/,
    "communication": /消息|message|slack|discord|邮件|email|通知|notify/,
  };

  for (const [cat, pattern] of Object.entries(categories)) {
    if (pattern.test(desc)) return cat;
  }
  return "other";
}

function evaluateComplexity(desc: string, steps: string[]): "simple" | "medium" | "complex" {
  const length = desc.length;
  const stepCount = steps.length;

  if (length < 100 && stepCount <= 2) return "simple";
  if (length > 500 || stepCount > 5) return "complex";
  return "medium";
}

interface SkillSpec {
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

function generateSpec(description: string, analysis: DescriptionAnalysis): SkillSpec {
  // 根据复杂度建议自由度
  const freedom = analysis.complexity === "simple" ? "high" :
                  analysis.complexity === "complex" ? "low" : "medium";

  // 建议的脚本
  const suggestedScripts: string[] = [];
  if (analysis.needsScripts) {
    if (/pdf/.test(description.toLowerCase())) suggestedScripts.push("scripts/process_pdf.py");
    if (/excel|xlsx/.test(description.toLowerCase())) suggestedScripts.push("scripts/process_excel.py");
    if (/git/.test(description.toLowerCase())) suggestedScripts.push("scripts/git_helper.sh");
  }

  // 建议的参考文档
  const suggestedReferences: string[] = [];
  if (analysis.needsReferences) {
    suggestedReferences.push(`references/${analysis.name}_guide.md`);
    if (/api/.test(description.toLowerCase())) suggestedReferences.push("references/api_docs.md");
  }

  return {
    name: analysis.name,
    description: description.slice(0, 200),
    category: analysis.category,
    triggers: analysis.triggers.length > 0 ? analysis.triggers : [`/${analysis.name}`, `"${analysis.name}"`],
    workflow: {
      inputs: analysis.inputs.length > 0 ? analysis.inputs : ["用户请求"],
      steps: analysis.steps.length > 0 ? analysis.steps : [
        "1. 理解用户需求",
        "2. 收集必要信息",
        "3. 执行核心任务",
        "4. 验证并输出结果",
      ],
      outputs: analysis.outputs.length > 0 ? analysis.outputs : ["处理结果"],
    },
    resources: {
      needsScripts: analysis.needsScripts,
      needsReferences: analysis.needsReferences,
      suggestedScripts,
      suggestedReferences,
    },
    freedom,
  };
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  type: "text" | "select" | "multiselect";
  options?: string[];
  required: boolean;
  hint?: string;
}

function generateClarifyingQuestions(analysis: DescriptionAnalysis): ClarifyingQuestion[] {
  const questions: ClarifyingQuestion[] = [];

  // 名称确认
  if (!analysis.hasName) {
    questions.push({
      id: "name",
      question: "请为这个 Skill 起一个名称",
      type: "text",
      required: true,
      hint: `建议名称: ${analysis.name} (小写字母、数字、短横线)`,
    });
  }

  // 触发条件
  if (!analysis.hasTriggers) {
    questions.push({
      id: "triggers",
      question: "这个 Skill 应该在什么情况下被触发？",
      type: "multiselect",
      options: [
        "当用户输入特定命令时 (如 /skill-name)",
        "当用户提到特定关键词时",
        "当用户处理特定类型文件时",
        "手动触发",
      ],
      required: true,
    });
  }

  // 输入输出
  if (!analysis.hasInputOutput) {
    questions.push({
      id: "inputs",
      question: "这个 Skill 需要什么输入？",
      type: "text",
      required: false,
      hint: "例如: 文件路径、用户文本、配置参数等",
    });
    questions.push({
      id: "outputs",
      question: "这个 Skill 会产生什么输出？",
      type: "text",
      required: false,
      hint: "例如: 生成的文件、处理结果、报告等",
    });
  }

  // 复杂度相关
  if (analysis.complexity === "complex") {
    questions.push({
      id: "freedom",
      question: "执行过程的灵活度应该如何？",
      type: "select",
      options: [
        "高 - 多种方法都可以，由 Claude 判断",
        "中 - 有推荐模式，但允许变化",
        "低 - 必须严格按步骤执行",
      ],
      required: true,
      hint: "复杂任务建议选择低灵活度以确保一致性",
    });
  }

  // 是否需要外部资源
  if (analysis.needsScripts || analysis.needsReferences) {
    questions.push({
      id: "resources",
      question: "是否需要附带额外资源？",
      type: "multiselect",
      options: [
        "Python/Bash 脚本",
        "参考文档/API 说明",
        "模板文件",
        "不需要",
      ],
      required: false,
    });
  }

  return questions;
}
