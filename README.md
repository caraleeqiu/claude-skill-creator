# Claude Skill Creator

> 发现、安装、创建 Claude Code Skills 的一站式平台

**线上地址**: https://claude-skill-creator.vercel.app

## 功能特性

### 1. Skill 市场 (50+ 官方 Skills)
- **官方 Skills**: Anthropic, Vercel, Cloudflare, Stripe, HuggingFace, Google Labs, Expo 等
- **分类浏览**: 开发工具、自动化、内容创作、生产力、数据处理、设计、通讯
- **一键安装**: 复制命令到终端执行即可

### 2. AI 创建 Skill
- 自然语言描述，自动生成 Skill
- 实时预览和验证
- 安全扫描（检测恶意代码）

### 3. 多种安装方式
- **复制安装命令**: 在终端执行 `curl` 命令下载
- **下载 ZIP**: 手动解压到 `~/.claude/commands/`
- **GitHub 上传**: OAuth 登录后直接发布到自己仓库

### 4. 安全保护
- 上下文感知的安全检测（减少误报）
- 检测危险命令、凭证窃取、prompt 注入等
- 风险等级提示

## 快速开始

### 安装 Skill

```bash
# 方式 1: 使用网站复制的命令（推荐）
mkdir -p ~/.claude/commands && curl -sL "SKILL_URL" -o ~/.claude/commands/skill-name.md

# 方式 2: 手动下载
mkdir -p ~/.claude/commands
# 将 Skill 内容保存为 ~/.claude/commands/skill-name.md

# 使用
# 在 Claude Code 中输入 /skill-name 即可触发
```

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/claude-skill-creator.git
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

### 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `GITHUB_TOKEN` | 是 | GitHub Personal Access Token (用于爬取) |
| `GITHUB_CLIENT_ID` | 否 | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | 否 | GitHub OAuth App Client Secret |

## 支持的官方 Skill 来源

| 组织 | Skills 数量 | 说明 |
|------|-------------|------|
| [Anthropic](https://github.com/anthropics/skills) | 16 | 官方 Skills (docx, pdf, xlsx, mcp-builder 等) |
| [Vercel](https://github.com/vercel-labs/agent-skills) | 8 | React/Next.js 最佳实践 |
| [Cloudflare](https://github.com/cloudflare/skills) | 7 | Workers, Wrangler, Durable Objects |
| [HuggingFace](https://github.com/huggingface/skills) | 8 | ML/AI 模型训练和部署 |
| [Stripe](https://github.com/stripe/ai) | 2 | 支付集成最佳实践 |
| [Supabase](https://github.com/supabase/agent-skills) | 1 | PostgreSQL 最佳实践 |
| [Google Labs](https://github.com/google-labs-code/stitch-skills) | 6 | UI/设计组件 |
| [Expo](https://github.com/expo/skills) | 3 | React Native 移动开发 |
| [Trail of Bits](https://github.com/trailofbits/skills) | 20+ | 安全审计和分析 |

## 技术栈

- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS 4
- **API**: GitHub REST API (Octokit)
- **部署**: Vercel

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/skills` | GET | 获取所有 skills |
| `/api/skills/generate` | POST | AI 生成 skill |
| `/api/skills/scan` | POST | 安全扫描 |
| `/api/github/upload` | POST | 上传到 GitHub |
| `/api/auth/github` | GET | GitHub OAuth 登录 |
| `/api/download` | POST | 生成 ZIP 下载 |

## 更新日志

### v0.3.0
- 扩充默认 skills 到 50+ 个官方 skills
- 支持爬取子目录 skills (如 anthropics/skills/skills/docx)
- 使用 curl 命令安装，支持子目录 URL
- 移除 awesome list 仓库（只保留真正的 skills）

### v0.2.0
- 修复安装路径：`~/.claude/skills/` → `~/.claude/commands/`
- 优化 OAuth Token 安全性
- 改进安全扫描逻辑
- 添加 Toast 通知

### v0.1.0
- 初始版本

## 数据来源

- [Anthropic Official Skills](https://github.com/anthropics/skills)
- [VoltAgent Awesome Agent Skills](https://github.com/VoltAgent/awesome-agent-skills)
- [Awesome Claude Skills](https://github.com/travisvn/awesome-claude-skills)

## License

MIT
