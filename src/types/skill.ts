export interface Skill {
  id: string;
  name: string;
  description: string;
  author: string;
  repo_url: string;
  stars: number;
  category: string;
  tags: string[];
  skill_md_url: string;
  created_at: string;
  updated_at: string;
  // 新增字段
  platform: "claude" | "openclaw" | "both";  // 支持的平台
  source: "github" | "twitter" | "reddit" | "manual";  // 来源
  source_url?: string;  // 原始来源 URL (社交媒体帖子等)
}

export interface SkillCategory {
  id: string;
  name: string;
  name_cn: string;
  icon: string;
  count: number;
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  { id: 'dev-tools', name: 'Dev Tools', name_cn: '开发工具', icon: 'Code', count: 0 },
  { id: 'automation', name: 'Automation', name_cn: '自动化', icon: 'Zap', count: 0 },
  { id: 'content', name: 'Content', name_cn: '内容创作', icon: 'FileText', count: 0 },
  { id: 'productivity', name: 'Productivity', name_cn: '生产力', icon: 'Rocket', count: 0 },
  { id: 'data', name: 'Data', name_cn: '数据处理', icon: 'Database', count: 0 },
  { id: 'design', name: 'Design', name_cn: '设计', icon: 'Palette', count: 0 },
  { id: 'communication', name: 'Communication', name_cn: '通讯', icon: 'MessageSquare', count: 0 },
  { id: 'other', name: 'Other', name_cn: '其他', icon: 'Box', count: 0 },
];
