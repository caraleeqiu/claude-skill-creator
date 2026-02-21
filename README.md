# Claude Skill Creator

> 发现、安装、创建 Claude Code Skills 的一站式平台

**线上地址**: https://claude-skill-creator.vercel.app

## 功能特性

### 1. Skill 市场
- 自动爬取 GitHub 上的 Claude Skills（解析 awesome list）
- 分类浏览：开发工具、自动化、内容创作、生产力、数据处理、设计、通讯
- 关键词搜索
- 一键复制安装命令

### 2. AI 创建 Skill
- 自然语言描述，AI 自动生成 Skill
- 实时预览和验证
- 符合 Claude Code 官方规范
- 安全扫描（检测恶意代码）

### 3. 多种安装方式
- 一键复制安装命令
- 下载 ZIP 到本地
- GitHub OAuth 登录后直接上传到自己仓库

### 4. 安全保护
- 自动扫描 Skill 内容
- 上下文感知的安全检测（减少误报）
- 检测危险命令、凭证窃取、prompt 注入等
- 风险等级提示

### 5. 定时更新
- Vercel Cron 每天自动爬取
- 支持手动刷新

## 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/claude-skill-creator.git
cd claude-skill-creator

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 添加配置

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/claude-skill-creator)

### 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `GITHUB_TOKEN` | 是 | GitHub Personal Access Token (用于爬取) |
| `GITHUB_CLIENT_ID` | 否 | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | 否 | GitHub OAuth App Client Secret |
| `CRON_SECRET` | 否 | Cron 任务密钥 |

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
| `/api/skills/scan` | POST | 安全扫描 |
| `/api/skills/detail` | GET | 获取 skill 详情 |
| `/api/github/upload` | POST | 上传到 GitHub |
| `/api/auth/github` | GET | GitHub OAuth 登录 |
| `/api/download` | POST | 生成 ZIP 下载 |
| `/api/cron/crawl` | GET | 触发爬取 |

## Skill 安装

```bash
# 方式 1: 下载到本地
curl -sL https://raw.githubusercontent.com/AUTHOR/SKILL_NAME/main/SKILL.md \
  -o ~/.claude/commands/SKILL_NAME.md

# 方式 2: 手动创建
mkdir -p ~/.claude/commands
# 将 Skill 内容保存为 ~/.claude/commands/skill-name.md

# 使用
# 在 Claude Code 中输入 /skill-name 即可触发
```

## 项目结构

```
src/
├── app/
│   ├── page.tsx                    # 首页
│   └── api/
│       ├── skills/                 # Skills API
│       │   ├── route.ts            # 列表
│       │   ├── generate/           # AI 生成
│       │   ├── scan/               # 安全扫描
│       │   └── detail/             # 详情
│       ├── auth/github/            # OAuth
│       ├── github/upload/          # 上传
│       ├── download/               # ZIP 下载
│       └── cron/crawl/             # 定时爬取
├── lib/
│   ├── github-crawler.ts           # 爬虫核心
│   ├── skill-generator.ts          # AI 生成
│   ├── security-scanner.ts         # 安全扫描
│   ├── default-skills.ts           # 默认数据
│   └── utils.ts                    # 工具函数
└── types/
    └── skill.ts                    # 类型定义
```

## 数据来源

- [GitHub Topics: claude-skills](https://github.com/topics/claude-skills)
- [Anthropic Official Skills](https://github.com/anthropics/skills)
- [Awesome Claude Skills](https://github.com/travisvn/awesome-claude-skills)

## 更新日志

### v0.2.0
- 修复安装路径：`~/.claude/skills/` → `~/.claude/commands/`
- 优化 OAuth Token 安全性（localStorage + 过期机制）
- 添加 Token 格式验证
- 改进安全扫描逻辑（上下文感知，减少误报）
- 优化 Skill 生成格式
- 添加 Toast 通知替代 alert
- 修复 img 标签 CLS 问题

### v0.1.0
- 初始版本

## License

MIT
