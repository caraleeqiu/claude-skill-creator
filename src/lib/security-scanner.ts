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

// 危险模式列表
const DANGEROUS_PATTERNS = [
  // 系统命令注入
  { pattern: /rm\s+-rf\s+[\/~]/, message: "检测到危险的删除命令 (rm -rf)", severity: "critical" as const },
  { pattern: /sudo\s+rm/, message: "检测到 sudo 删除命令", severity: "critical" as const },
  { pattern: /mkfs|fdisk|dd\s+if=/, message: "检测到磁盘操作命令", severity: "critical" as const },
  { pattern: /:(){ :\|:& };:/, message: "检测到 fork bomb", severity: "critical" as const },

  // 凭证窃取
  { pattern: /\.ssh\/|id_rsa|id_ed25519/, message: "尝试访问 SSH 密钥", severity: "critical" as const },
  { pattern: /\.aws\/credentials|\.env/, message: "尝试访问敏感配置文件", severity: "critical" as const },
  { pattern: /keychain|password|credential/i, message: "可能涉及凭证操作", severity: "warning" as const },

  // 网络恶意行为
  { pattern: /curl.*\|\s*bash|wget.*\|\s*sh/, message: "检测到远程脚本执行 (curl | bash)", severity: "critical" as const },
  { pattern: /nc\s+-e|netcat.*-e|\/dev\/tcp\//, message: "检测到反向 shell 模式", severity: "critical" as const },
  { pattern: /base64\s+-d.*\|\s*(bash|sh)/, message: "检测到编码命令执行", severity: "critical" as const },

  // 数据外泄
  { pattern: /curl.*-d.*\$\(|wget.*--post-data/, message: "可能存在数据外泄", severity: "danger" as const },
  { pattern: /exfil|upload.*secret|send.*token/i, message: "可疑的数据传输关键词", severity: "warning" as const },

  // Prompt 注入
  { pattern: /<\/?system>|<\/?user>|<\/?assistant>/i, message: "检测到 XML 标签 (可能的 prompt 注入)", severity: "danger" as const },
  { pattern: /ignore\s+(previous|above)\s+instructions/i, message: "检测到 prompt 注入尝试", severity: "critical" as const },
  { pattern: /you\s+are\s+now\s+(a|an)\s+/i, message: "可疑的角色切换指令", severity: "warning" as const },

  // 权限提升
  { pattern: /chmod\s+777|chmod\s+\+s/, message: "危险的权限修改", severity: "danger" as const },
  { pattern: /sudo\s+su|sudo\s+-i/, message: "尝试获取 root 权限", severity: "warning" as const },

  // 混淆代码
  { pattern: /eval\s*\(\s*atob|eval\s*\(\s*String\.fromCharCode/, message: "检测到代码混淆", severity: "danger" as const },
  { pattern: /\\x[0-9a-f]{2}\\x[0-9a-f]{2}\\x[0-9a-f]{2}/i, message: "检测到十六进制编码", severity: "warning" as const },
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
  for (const { pattern, message, severity } of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
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
