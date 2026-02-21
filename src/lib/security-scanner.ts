// 安全扫描器 - 检测 SKILL.md 中的潜在风险

export interface SecurityScanResult {
  safe: boolean;
  risk: "low" | "medium" | "high" | "critical";
  warnings: string[];
  blocked: boolean;
  details: {
    category: string;
    description: string;
    severity: "info" | "warning" | "danger";
  }[];
}

// 检测是否在代码块内（减少误报）
function isInCodeBlock(content: string, matchIndex: number): boolean {
  const beforeMatch = content.slice(0, matchIndex);
  const codeBlockStarts = (beforeMatch.match(/```/g) || []).length;
  return codeBlockStarts % 2 === 1; // 奇数个 ``` 表示在代码块内
}

// 检测是否在否定上下文中（如 "don't", "never", "avoid"）
function isNegatedContext(content: string, matchIndex: number): boolean {
  const contextStart = Math.max(0, matchIndex - 50);
  const context = content.slice(contextStart, matchIndex).toLowerCase();
  return /\b(don'?t|never|avoid|not|shouldn'?t|warning|danger|禁止|不要|避免|警告)\b/.test(context);
}

// 危险模式列表 - 使用函数进行更精确的检测
interface DangerousPattern {
  pattern: RegExp;
  message: string;
  severity: "critical" | "danger" | "warning";
  contextCheck?: boolean; // 是否需要上下文检查
}

const DANGEROUS_PATTERNS: DangerousPattern[] = [
  // 系统命令注入 - 这些必须精确匹配
  { pattern: /rm\s+-rf\s+[\/~]/, message: "检测到危险的删除命令 (rm -rf)", severity: "critical" },
  { pattern: /sudo\s+rm\s+-/, message: "检测到 sudo 删除命令", severity: "critical" },
  { pattern: /mkfs\s+\/|fdisk\s+\/|dd\s+if=.*of=\/dev/, message: "检测到磁盘操作命令", severity: "critical" },
  { pattern: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, message: "检测到 fork bomb", severity: "critical" },

  // 凭证窃取 - 只检测实际的读取/访问操作
  { pattern: /cat\s+.*\.ssh\/|cat\s+.*id_rsa|cat\s+.*id_ed25519/, message: "检测到读取 SSH 密钥", severity: "critical" },
  { pattern: /cat\s+.*\.aws\/credentials|cat\s+.*\.env\b/, message: "检测到读取敏感配置文件", severity: "critical" },
  { pattern: /cp\s+.*\.ssh\/|cp\s+.*\.env\s/, message: "检测到复制敏感文件", severity: "critical" },

  // 网络恶意行为
  { pattern: /curl\s+[^|]*\|\s*(?:ba)?sh|wget\s+[^|]*\|\s*(?:ba)?sh/, message: "检测到远程脚本执行 (curl | bash)", severity: "critical" },
  { pattern: /nc\s+-[^|]*-e|netcat\s+[^|]*-e|\/dev\/tcp\//, message: "检测到反向 shell 模式", severity: "critical" },
  { pattern: /base64\s+-d[^|]*\|\s*(?:ba)?sh/, message: "检测到编码命令执行", severity: "critical" },

  // 数据外泄 - 只检测包含命令替换的情况
  { pattern: /curl\s+.*-d\s*['"]?\$\(/, message: "可能存在数据外泄 (curl POST)", severity: "danger" },
  { pattern: /wget\s+.*--post-data=?\s*['"]?\$\(/, message: "可能存在数据外泄 (wget POST)", severity: "danger" },

  // Prompt 注入 - 精确匹配
  { pattern: /<\/?system>|<\/?user>|<\/?assistant>/i, message: "检测到 XML 标签 (可能的 prompt 注入)", severity: "danger" },
  { pattern: /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts?)/i, message: "检测到 prompt 注入尝试", severity: "critical" },
  { pattern: /\byou\s+are\s+now\s+(a|an)\s+(?!user|developer)/i, message: "可疑的角色切换指令", severity: "warning", contextCheck: true },

  // 权限提升
  { pattern: /chmod\s+777\s+[\/~]|chmod\s+\+s\s+/, message: "危险的权限修改", severity: "danger" },
  { pattern: /sudo\s+su\s*$|sudo\s+-i\s*$/, message: "尝试获取 root 权限", severity: "warning", contextCheck: true },

  // 混淆代码
  { pattern: /eval\s*\(\s*atob\s*\(|eval\s*\(\s*String\.fromCharCode\s*\(/, message: "检测到代码混淆", severity: "danger" },
  { pattern: /(?:\\x[0-9a-f]{2}){5,}/i, message: "检测到十六进制编码序列", severity: "warning", contextCheck: true },
];

// 可疑但不一定危险的模式
const SUSPICIOUS_PATTERNS = [
  { pattern: /curl|wget|fetch/, message: "包含网络请求命令", severity: "info" as const },
  { pattern: /eval|exec/, message: "包含动态执行命令", severity: "info" as const },
  { pattern: /\$\(.*\)|`.*`/, message: "包含命令替换", severity: "info" as const },
  { pattern: /\/etc\/|\/var\/|\/usr\//, message: "访问系统目录", severity: "info" as const },
  { pattern: /npm\s+install|pip\s+install/, message: "安装外部包", severity: "info" as const },
];

export function scanSkillContent(content: string): SecurityScanResult {
  const warnings: string[] = [];
  const details: SecurityScanResult["details"] = [];
  let maxSeverity: "low" | "medium" | "high" | "critical" = "low";
  let blocked = false;

  // 检查危险模式
  for (const { pattern, message, severity, contextCheck } of DANGEROUS_PATTERNS) {
    const match = pattern.exec(content);
    if (match) {
      // 如果需要上下文检查，验证是否是误报
      if (contextCheck) {
        const matchIndex = match.index;
        // 如果在否定上下文中（如 "don't do this"），跳过
        if (isNegatedContext(content, matchIndex)) {
          continue;
        }
        // 如果在代码块内且是文档性质的，降低严重性
        if (isInCodeBlock(content, matchIndex) && severity === "warning") {
          details.push({
            category: "suspicious",
            description: `${message} (在代码示例中)`,
            severity: "info",
          });
          continue;
        }
      }

      warnings.push(message);
      details.push({
        category: "dangerous",
        description: message,
        severity: severity === "critical" ? "danger" : severity === "danger" ? "danger" : "warning",
      });

      if (severity === "critical") {
        maxSeverity = "critical";
        blocked = true;
      } else if (severity === "danger" && maxSeverity !== "critical") {
        maxSeverity = "high";
      } else if (severity === "warning" && maxSeverity === "low") {
        maxSeverity = "medium";
      }
    }
  }

  // 检查可疑模式
  for (const { pattern, message, severity } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      details.push({
        category: "suspicious",
        description: message,
        severity: "info",
      });
    }
  }

  // 检查文件大小
  if (content.length > 50000) {
    warnings.push("文件内容过长 (>50KB)");
    details.push({
      category: "size",
      description: "文件内容过长，可能包含隐藏内容",
      severity: "warning",
    });
    if (maxSeverity === "low") maxSeverity = "medium";
  }

  // 检查是否有过多的 shell 命令
  const shellCommandCount = (content.match(/```(bash|sh|shell|zsh)/g) || []).length;
  if (shellCommandCount > 10) {
    warnings.push("包含大量 shell 命令块");
    details.push({
      category: "commands",
      description: `包含 ${shellCommandCount} 个 shell 命令块`,
      severity: "warning",
    });
  }

  return {
    safe: maxSeverity === "low" && warnings.length === 0,
    risk: maxSeverity,
    warnings,
    blocked,
    details,
  };
}

// 快速检查 - 用于列表展示
export function quickSecurityCheck(content: string): {
  safe: boolean;
  risk: "low" | "medium" | "high" | "critical";
} {
  // 只检查最危险的模式
  for (const { pattern } of DANGEROUS_PATTERNS.filter(p => p.severity === "critical")) {
    if (pattern.test(content)) {
      return { safe: false, risk: "critical" };
    }
  }

  for (const { pattern } of DANGEROUS_PATTERNS.filter(p => p.severity === "danger")) {
    if (pattern.test(content)) {
      return { safe: false, risk: "high" };
    }
  }

  return { safe: true, risk: "low" };
}
