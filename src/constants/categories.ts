// Skill 分类
export interface SkillCategory {
  id: string;
  name: string;
  name_cn: string;
  icon: string;
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  { id: "dev-tools", name: "Dev Tools", name_cn: "开发工具", icon: "Code" },
  { id: "automation", name: "Automation", name_cn: "自动化", icon: "Zap" },
  { id: "content", name: "Content", name_cn: "内容创作", icon: "FileText" },
  { id: "productivity", name: "Productivity", name_cn: "生产力", icon: "Rocket" },
  { id: "data", name: "Data", name_cn: "数据处理", icon: "Database" },
  { id: "design", name: "Design", name_cn: "设计", icon: "Palette" },
  { id: "communication", name: "Communication", name_cn: "通讯", icon: "MessageSquare" },
  { id: "other", name: "Other", name_cn: "其他", icon: "Box" },
];

// 热门搜索标签
export const HOT_TAGS = [
  "git", "commit", "deploy", "test", "api", "docker",
  "文档", "自动化", "数据分析", "AI", "效率", "写作",
];
