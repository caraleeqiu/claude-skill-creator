# Claude Skill Creator

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/caraleeqiu/claude-skill-creator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Skills](https://img.shields.io/badge/Skills-160%2B-blue)
![Platforms](https://img.shields.io/badge/平台-小红书%20%7C%20抖音%20%7C%20B站%20%7C%20知乎-red)

🚀 **Claude Code 的 App Store** | **The App Store for Claude Code Skills**

> 发现、安装、创建 Claude Code Skills 的一站式平台
> Discover, install, and create Claude Code Skills in one place

**在线体验 / Live Demo**: https://claude-skill-creator.vercel.app

---

## ✨ 亮点 / Highlights

| 功能 | Feature | 说明 |
|------|---------|------|
| 🛒 **Skill 市场** | Skill Marketplace | 160+ 官方/社区 Skills，一键安装 |
| 🤖 **AI 生成** | AI Generation | 自然语言描述 → 自动生成 Skill |
| 🔗 **链接抓取** | URL Fetching | 支持 Twitter, Reddit, GitHub, 小红书, 抖音, B站, 知乎, 微博, 公众号 |
| 📄 **文档上传** | File Upload | 拖拽上传 TXT, Markdown, PDF, JSON, YAML |
| 🔒 **安全扫描** | Security Scan | 检测恶意代码、凭证窃取、prompt 注入 |
| 🔄 **格式转换** | Format Convert | Claude Skill ↔ OpenClaw Plugin 一键互转 |

---

## 功能特性

### 1. Skill 市场 (160+ 官方/社区 Skills)
- **官方 Skills**: Anthropic, Vercel, Cloudflare, OpenAI, HuggingFace, Google Labs, Trail of Bits, WordPress, HashiCorp 等
- **科学/AI**: K-Dense-AI 科学研究 (9k⭐), Orchestra AI 研究 (3.7k⭐)
- **社区精选**: obra/superpowers, wondelai/skills, marketingskills 等 100 星以上高质量 Skills
- **分类浏览**: 开发工具、自动化、内容创作、生产力、数据处理、设计、通讯
- **一键安装**: 复制命令到终端执行即可

### 2. AI 创建 Skill
- 自然语言描述，自动生成 Skill
- **从链接生成**: 支持 Twitter/X、Reddit、GitHub、小红书、抖音、B站、知乎、微博、微信公众号
- **文档上传**: 支持 TXT、Markdown、PDF、JSON、YAML
- 实时预览和验证
- 安全扫描（检测恶意代码）
- 一键转换 Claude ↔ OpenClaw 格式

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
| [Vercel](https://github.com/vercel-labs/agent-skills) | 9 | React/Next.js 最佳实践, 缓存策略 |
| [Cloudflare](https://github.com/cloudflare/skills) | 6 | Workers, Wrangler, AI Agents, MCP Server |
| [HuggingFace](https://github.com/huggingface/skills) | 9 | ML/AI 模型训练、评估、数据集管理 |
| [Stripe](https://github.com/stripe/ai) | 2 | 支付集成最佳实践 |
| [Supabase](https://github.com/supabase/agent-skills) | 1 | PostgreSQL 最佳实践 |
| [Google Labs](https://github.com/google-labs-code/stitch-skills) | 7 | UI/设计组件, shadcn/ui |
| [Expo](https://github.com/expo/skills) | 3 | React Native 移动开发 |
| [Trail of Bits](https://github.com/trailofbits/skills) | 11 | 安全审计、静态分析、智能合约 |
| [Sentry](https://github.com/getsentry/skills) | 5 | 代码审查、PR、Bug 检测 |
| [OpenAI](https://github.com/openai/skills) | 10 | Playwright, 安全审计, 部署 |
| [HashiCorp](https://github.com/hashicorp/agent-skills) | 3 | Terraform 代码生成、模块开发 |
| [CallStack](https://github.com/callstackincubator/agent-skills) | 3 | React Native 最佳实践 |
| [fal.ai](https://github.com/fal-ai-community/skills) | 4 | AI 图像/视频生成 |
| [Sanity](https://github.com/sanity-io/agent-toolkit) | 2 | CMS 内容建模 |
| [Neon](https://github.com/neondatabase/agent-skills) | 1 | Serverless Postgres |
| [Remotion](https://github.com/remotion-dev/skills) | 1 | React 视频创作 |
| [Replicate](https://github.com/replicate/skills) | 1 | AI 模型运行 |
| [Tinybird](https://github.com/tinybirdco/tinybird-agent-skills) | 1 | 实时数据分析 |
| [Firecrawl](https://github.com/firecrawl/cli) | 1 | Web 爬虫 |
| [obra/superpowers](https://github.com/obra/superpowers) | 7 | TDD, 调试, 并行代理 |
| [wondelai/skills](https://github.com/wondelai/skills) | 10 | 商业框架 (JTBD, 精益创业) |
| [zxkane/aws-skills](https://github.com/zxkane/aws-skills) | 3 | AWS CDK, Serverless |
| [levnikolaevich](https://github.com/levnikolaevich/claude-code-skills) | 6 | 全流程开发工作流 |
| [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) | 4 | 数据分析, 内容创作 |
| [K-Dense-AI](https://github.com/K-Dense-AI/claude-scientific-skills) | 4 | 生物/化学信息学, 临床研究 |
| [Orchestra-Research](https://github.com/Orchestra-Research/AI-research-SKILLs) | 7 | AI 模型训练, RAG, 推理 |
| [WordPress](https://github.com/WordPress/agent-skills) | 4 | Gutenberg, 插件开发 |
| [Apple HIG](https://github.com/raintree-technology/apple-hig-skills) | 4 | iOS/macOS 设计指南 |
| [Marketing Skills](https://github.com/coreyhaines31/marketingskills) | 6 | SEO, 文案, CRO |
| 社区精选 | 10+ | iOS, Java, OWASP 等 |

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

### v0.5.0 (最新)
- **架构重构**: 组件化设计，Zustand 状态管理
- **安全增强**: httpOnly Cookie 存储 Token
- **链接抓取**: 支持 9 大平台 (Twitter, Reddit, GitHub, 小红书, 抖音, B站, 知乎, 微博, 公众号)
- **文档上传**: 拖拽上传 TXT/MD/PDF/JSON/YAML
- **缓存优化**: HTTP 缓存头 + localStorage 持久化
- **场景搜索**: 17 个使用场景快速筛选

### v0.4.0
- 扩充默认 skills 到 130+ 个官方/社区 skills
- 新增官方: Trail of Bits (11), Sentry (5), OpenAI (10), HashiCorp (3), CallStack (3), fal.ai (4)
- 新增官方: Sanity CMS, Neon, Remotion, Replicate, Tinybird, Firecrawl
- 新增社区: obra/superpowers (7) - TDD, 调试, 并行代理
- 新增社区: wondelai/skills (10) - 商业框架 (JTBD, 精益创业, 蓝海战略)
- 新增社区: zxkane/aws-skills (3) - AWS CDK, Serverless
- 新增社区: levnikolaevich (6) - 全流程开发工作流, 代码质量检查
- 新增社区: ComposioHQ (4) - 数据分析, D3 可视化
- 新增社区: iOS 开发指南, Java 规则, Skills 管理器
- 补全: Cloudflare, HuggingFace, Google Labs, Vercel 遗漏的 skills

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
