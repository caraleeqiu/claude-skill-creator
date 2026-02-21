// 应用配置常量
export const CONFIG = {
  // 缓存配置
  CACHE_DURATION_MS: 60 * 60 * 1000, // 1 小时
  CRAWL_TIMEOUT_MS: 8000,

  // 限制
  MAX_SKILL_SIZE_BYTES: 50000,
  MAX_SKILL_LINES: 500,
  MAX_DESCRIPTION_LENGTH: 200,

  // Toast
  TOAST_DURATION_MS: 3000,

  // 分页
  PAGE_SIZE: 20,
} as const;

// 平台主题
export const PLATFORM_THEME = {
  claude: {
    name: "Claude Code",
    primary: "orange",
    gradient: "from-orange-500 to-amber-500",
    hoverGradient: "hover:from-orange-600 hover:to-amber-600",
    bg: "bg-orange-50 dark:bg-orange-500/10",
    border: "border-orange-200 dark:border-orange-500/30",
    text: "text-orange-600",
    shadow: "shadow-orange-500/25",
  },
  openclaw: {
    name: "OpenClaw",
    primary: "purple",
    gradient: "from-purple-500 to-indigo-500",
    hoverGradient: "hover:from-purple-600 hover:to-indigo-600",
    bg: "bg-purple-50 dark:bg-purple-500/10",
    border: "border-purple-200 dark:border-purple-500/30",
    text: "text-purple-600",
    shadow: "shadow-purple-500/25",
  },
} as const;

// 来源配置
export const SOURCE_CONFIG = {
  github: { label: "GitHub", icon: "Github" },
  twitter: { label: "𝕏", icon: "Twitter" },
  reddit: { label: "Reddit", icon: "MessageSquare" },
  manual: { label: "Manual", icon: "Edit" },
} as const;

export type Platform = keyof typeof PLATFORM_THEME;
export type Source = keyof typeof SOURCE_CONFIG;
