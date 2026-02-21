# Claude Skill Creator

发现、安装、创建 Claude Code Skills 的一站式平台。

## 功能特性

### 1. Skill 市场
- 自动爬取 GitHub 上的 Claude Skills
- 分类浏览：开发工具、自动化、内容创作、生产力、数据处理、设计、通讯
- 关键词搜索
- 一键复制安装命令

### 2. AI 创建 Skill
- 自然语言描述，AI 自动生成 SKILL.md
- 实时预览和验证
- 符合 Anthropic 官方规范

### 3. 一键上传 GitHub
- 自动创建仓库
- 添加正确的 topics
- 生成安装命令

### 4. 定时更新
- Vercel Cron 每 6 小时自动爬取
- 支持手动刷新

## 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/claude-skill-creator.git
cd claude-skill-creator

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 添加 GITHUB_TOKEN

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/claude-skill-creator)

环境变量：
- `GITHUB_TOKEN`: GitHub Personal Access Token (提高 API 速率限制)
- `CRON_SECRET`: Cron 任务密钥

## 技术栈

- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS
- **API**: GitHub REST API (Octokit)
- **部署**: Vercel

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/skills` | GET | 获取所有 skills |
| `/api/skills/generate` | POST | AI 生成 skill |
| `/api/github/upload` | POST | 上传到 GitHub |
| `/api/cron/crawl` | GET | 触发爬取 |

## Skill 安装

```bash
# 安装任意 skill
mkdir -p ~/.claude/skills/SKILL_NAME
git clone https://github.com/AUTHOR/SKILL_NAME.git ~/.claude/skills/SKILL_NAME
```

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # 首页
│   └── api/
│       ├── skills/           # Skills API
│       ├── github/           # GitHub 上传
│       └── cron/             # 定时任务
├── lib/
│   ├── github-crawler.ts     # 爬虫核心
│   ├── skill-generator.ts    # AI 生成
│   └── utils.ts              # 工具函数
└── types/
    └── skill.ts              # 类型定义
```

## License

MIT
