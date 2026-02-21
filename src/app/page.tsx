"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Download, Star, ExternalLink, Copy, Check,
  Code, Zap, FileText, Rocket, Database, Palette, MessageSquare,
  Box, Sparkles, Upload, RefreshCw, X, Github, Terminal,
  Shield, ShieldAlert, ShieldCheck, AlertTriangle, FileDown, LogOut,
  CheckCircle, XCircle, Info
} from "lucide-react";
import type { Skill } from "@/types/skill";
import { SKILL_CATEGORIES } from "@/types/skill";

// Toast 通知组件
interface ToastMessage {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastMessage["type"], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg animate-slide-up ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
          {toast.type === "error" && <XCircle className="w-5 h-5" />}
          {toast.type === "info" && <Info className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code, Zap, FileText, Rocket, Database, Palette, MessageSquare, Box,
};

// GitHub 用户状态
interface GithubUser {
  token: string;
  login: string;
  avatar: string;
}

export default function Home() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [githubUser, setGithubUser] = useState<GithubUser | null>(null);
  const { showToast, ToastContainer } = useToast();

  // 从 localStorage 读取 GitHub 登录状态
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("github_auth");
        if (stored) {
          const authData = JSON.parse(stored);
          // 检查是否过期
          if (authData.expiresAt && Date.now() < authData.expiresAt) {
            setGithubUser({
              token: authData.token,
              login: authData.login,
              avatar: authData.avatar || "",
            });
          } else {
            // Token 已过期，清除
            localStorage.removeItem("github_auth");
          }
        }
      } catch {
        localStorage.removeItem("github_auth");
      }
    }
  }, []);

  const fetchSkills = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      if (refresh) params.set("refresh", "true");

      const res = await fetch(`/api/skills?${params}`);
      const data = await res.json();
      setSkills(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch skills:", e);
      setSkills([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, [category, search]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  async function copyInstallScript(skill: Skill) {
    const script = `mkdir -p ~/.claude/commands && git clone --depth 1 ${skill.repo_url} /tmp/${skill.name} && cp /tmp/${skill.name}/SKILL.md ~/.claude/commands/${skill.name}.md && rm -rf /tmp/${skill.name}`;
    await navigator.clipboard.writeText(script);
    setCopiedId(skill.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleLogout() {
    setGithubUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("github_auth");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <ToastContainer />
      {/* Header */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-md dark:bg-gray-950/80 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Claude Skill Creator
                </h1>
                <p className="text-sm text-gray-500">发现、安装、创建 Claude Code Skills</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* GitHub 登录状态 */}
              {githubUser ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  {githubUser.avatar && (
                    <img src={githubUser.avatar} alt="" width={24} height={24} className="w-6 h-6 rounded-full" />
                  )}
                  <span className="text-sm font-medium">{githubUser.login}</span>
                  <button onClick={handleLogout} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    <LogOut className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <a
                  href="/api/auth/github"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span className="text-sm">登录</span>
                </a>
              )}
              <button
                onClick={() => fetchSkills(true)}
                disabled={refreshing}
                className="p-2.5 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 dark:border-gray-700 dark:hover:border-orange-500 transition-all"
                title="刷新数据"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin text-orange-500" : "text-gray-600"}`} />
              </button>
              <button
                onClick={() => setShowCreator(!showCreator)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-lg shadow-orange-500/25 transition-all font-medium"
              >
                <Sparkles className="w-4 h-4" />
                AI 创建 Skill
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索 skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl bg-white dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-5 py-3.5 border border-gray-200 rounded-2xl bg-white dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 shadow-sm"
          >
            <option value="all">全部分类</option>
            {SKILL_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name_cn}
              </option>
            ))}
          </select>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {SKILL_CATEGORIES.map((cat) => {
            const Icon = iconMap[cat.icon] || Box;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(isActive ? "all" : cat.id)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 border-transparent text-white shadow-lg shadow-orange-500/25"
                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-orange-200 hover:shadow-md"
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <p className="text-xs font-medium truncate">{cat.name_cn}</p>
              </button>
            );
          })}
        </div>

        {/* Skill Creator Panel */}
        {showCreator && (
          <SkillCreator
            onClose={() => setShowCreator(false)}
            githubUser={githubUser}
            showToast={showToast}
          />
        )}

        {/* Skills Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mb-4" />
            <p className="text-gray-500">正在从 GitHub 获取 Skills...</p>
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-20">
            <Box className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">没有找到相关 Skills</p>
            <p className="text-sm text-gray-400">试试调整搜索条件，或创建一个新的 Skill</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onCopy={() => copyInstallScript(skill)}
                copied={copiedId === skill.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-100 dark:border-gray-800 py-8 mt-16 bg-white/50 dark:bg-gray-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p className="font-medium">Claude Skill Creator</p>
          <p className="mt-1">
            数据来源:{" "}
            <a href="https://github.com/topics/claude-skills" className="text-orange-500 hover:underline">
              GitHub
            </a>
            {" | "}
            <a href="https://github.com/anthropics/skills" className="text-orange-500 hover:underline">
              Anthropic Official
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function SkillCard({
  skill,
  onCopy,
  copied,
}: {
  skill: Skill;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="group p-6 rounded-2xl border-2 border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg">
          {skill.name}
        </h3>
        <div className="flex items-center gap-1 text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm font-medium">{skill.stars}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">
        {skill.description}
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {skill.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCopy}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm rounded-xl transition-all font-medium shadow-md shadow-orange-500/20"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              已复制!
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              一键安装
            </>
          )}
        </button>
        <a
          href={skill.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 border-2 border-gray-100 dark:border-gray-800 rounded-xl hover:border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

// 验证 GitHub Token 格式
function isValidGitHubToken(token: string): boolean {
  return /^(ghp_[a-zA-Z0-9]{36,}|github_pat_[a-zA-Z0-9]{22,}_[a-zA-Z0-9]{59,})$/.test(token);
}

function SkillCreator({
  onClose,
  githubUser,
  showToast,
}: {
  onClose: () => void;
  githubUser: GithubUser | null;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}) {
  const [step, setStep] = useState<"input" | "preview" | "upload">("input");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{
    name: string;
    skillMd: string;
    readme: string;
    category: string;
    tags: string[];
    validation: { valid: boolean; errors: string[] };
  } | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    repoUrl?: string;
    error?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [securityScan, setSecurityScan] = useState<{
    safe: boolean;
    risk: string;
    warnings: string[];
    blocked: boolean;
  } | null>(null);
  const [scanning, setScanning] = useState(false);

  // 获取实际使用的 token
  const activeToken = githubUser?.token || manualToken;

  async function handleGenerate() {
    if (!description.trim()) return;

    setGenerating(true);
    setSecurityScan(null);

    try {
      const res = await fetch("/api/skills/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, name }),
      });
      const data = await res.json();
      if (data.error) {
        showToast("error", data.error);
      } else {
        setGenerated(data);
        setName(data.name);
        // 安全扫描
        await runSecurityScan(data.skillMd);
        setStep("preview");
      }
    } catch {
      showToast("error", "生成失败，请重试");
    }
    setGenerating(false);
  }

  async function runSecurityScan(content: string) {
    setScanning(true);
    try {
      const res = await fetch("/api/skills/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      setSecurityScan(data);
    } catch {
      console.error("Security scan failed");
    }
    setScanning(false);
  }

  async function handleUpload() {
    if (!generated || !activeToken) return;

    setUploading(true);
    try {
      const res = await fetch("/api/github/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: activeToken,
          repoName: generated.name,
          skillMd: generated.skillMd,
          readme: generated.readme,
          description: description.slice(0, 100),
        }),
      });
      const data = await res.json();
      setUploadResult(data);
    } catch {
      setUploadResult({ success: false, error: "上传失败" });
    }
    setUploading(false);
  }

  async function handleDownloadZip() {
    if (!generated) return;

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: generated.name,
          skillMd: generated.skillMd,
          readme: generated.readme,
        }),
      });
      const data = await res.json();

      if (data.content) {
        // 创建下载链接
        const blob = new Blob(
          [Uint8Array.from(atob(data.content), c => c.charCodeAt(0))],
          { type: "application/zip" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      showToast("error", "下载失败");
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-8 rounded-3xl border-2 border-orange-100 bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-gray-900 dark:border-gray-800 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-orange-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI 创建 Skill</h2>
            <p className="text-sm text-gray-500">用自然语言描述你想要的 skill</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 px-6 py-4 bg-orange-50/50 dark:bg-gray-800/50 border-b border-orange-100 dark:border-gray-800">
        {["描述需求", "预览确认", "上传发布"].map((label, i) => {
          const stepIndex = ["input", "preview", "upload"].indexOf(step);
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : isDone
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm ${isActive ? "font-medium text-orange-600" : "text-gray-500"}`}>
                {label}
              </span>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700" />}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        {step === "input" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">描述你想要的 Skill</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：帮我创建一个自动生成 git commit message 的 skill，当我完成代码修改后，它会分析 git diff 的内容，然后生成符合 conventional commits 规范的提交信息..."
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-0 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Skill 名称 (可选)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                placeholder="auto-commit-message"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-0"
              />
              <p className="mt-1 text-xs text-gray-500">只能使用小写字母、数字和连字符</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!description.trim() || generating}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-medium transition-all"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  AI 生成 Skill
                </>
              )}
            </button>
          </div>
        )}

        {step === "preview" && generated && (
          <div className="space-y-4">
            {/* 安全扫描结果 */}
            {scanning ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-blue-600">正在进行安全扫描...</span>
              </div>
            ) : securityScan && (
              <div className={`p-4 rounded-xl border ${
                securityScan.blocked
                  ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                  : securityScan.safe
                  ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30"
                  : "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {securityScan.blocked ? (
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  ) : securityScan.safe ? (
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <Shield className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className={`font-medium ${
                    securityScan.blocked ? "text-red-600" : securityScan.safe ? "text-green-600" : "text-yellow-600"
                  }`}>
                    {securityScan.blocked ? "安全风险: 已阻止" : securityScan.safe ? "安全扫描: 通过" : `安全风险: ${securityScan.risk}`}
                  </span>
                </div>
                {securityScan.warnings.length > 0 && (
                  <ul className="text-sm space-y-1">
                    {securityScan.warnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Validation */}
            {!generated.validation.valid && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
                <p className="font-medium text-red-600 mb-2">格式警告</p>
                {generated.validation.errors.map((err, i) => (
                  <p key={i} className="text-sm text-red-500">• {err}</p>
                ))}
              </div>
            )}

            {/* Preview */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">SKILL.md</label>
                  <button
                    onClick={() => copyToClipboard(generated.skillMd)}
                    className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "已复制" : "复制"}
                  </button>
                </div>
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-sm overflow-auto h-72 font-mono">
                  {generated.skillMd}
                </pre>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">安装方式</label>
                <div className="p-4 bg-gray-900 text-green-400 rounded-xl text-sm font-mono mb-4">
                  <p className="text-gray-500 mb-2"># 方式1: 直接保存到 commands 目录</p>
                  <p className="break-all">mkdir -p ~/.claude/commands</p>
                  <p className="text-gray-500 mt-3 mb-2"># 将内容保存为 ~/.claude/commands/{generated.name}.md</p>
                  <p className="text-gray-500 mt-3 mb-2"># 方式2: 使用 /{generated.name} 触发</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                  <p className="text-sm font-medium text-orange-600 mb-2">分类: {generated.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {generated.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-md text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStep("input")}
                className="px-6 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                返回修改
              </button>
              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-2 px-6 py-3 border-2 border-green-500 text-green-600 rounded-xl hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors font-medium"
              >
                <FileDown className="w-5 h-5" />
                下载 ZIP
              </button>
              <button
                onClick={() => copyToClipboard(generated.skillMd)}
                className="flex items-center gap-2 px-6 py-3 border-2 border-orange-500 text-orange-500 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors font-medium"
              >
                <Terminal className="w-5 h-5" />
                复制内容
              </button>
              <button
                onClick={() => setStep("upload")}
                disabled={securityScan?.blocked}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-medium transition-all"
              >
                <Upload className="w-5 h-5" />
                上传到 GitHub
              </button>
            </div>
          </div>
        )}

        {step === "upload" && generated && (
          <div className="space-y-4">
            {uploadResult?.success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">上传成功!</h3>
                <a
                  href={uploadResult.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline flex items-center justify-center gap-2"
                >
                  <Github className="w-5 h-5" />
                  {uploadResult.repoUrl}
                </a>
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">安装命令:</p>
                  <code className="text-sm font-mono text-orange-500 break-all">
                    curl -sL {uploadResult.repoUrl}/raw/main/SKILL.md -o ~/.claude/commands/{generated.name}.md
                  </code>
                </div>
                <button
                  onClick={onClose}
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium"
                >
                  完成
                </button>
              </div>
            ) : (
              <>
                {/* 已登录 GitHub */}
                {githubUser ? (
                  <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl flex items-center gap-3">
                    <img src={githubUser.avatar} alt="" width={40} height={40} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium text-green-600">已登录: {githubUser.login}</p>
                      <p className="text-sm text-green-500">将上传到你的 GitHub 账号</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl">
                      <p className="text-sm text-blue-600 mb-2">
                        <strong>方式 1:</strong> 使用 GitHub 登录（推荐）
                      </p>
                      <a
                        href="/api/auth/github"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        <Github className="w-4 h-4" />
                        GitHub 登录
                      </a>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>方式 2:</strong> 手动输入 Token
                      </p>
                      <input
                        type="password"
                        value={manualToken}
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          setManualToken(value);
                        }}
                        placeholder="ghp_xxxxxxxxxxxxx 或 github_pat_xxxxx"
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 font-mono text-sm ${
                          manualToken && !isValidGitHubToken(manualToken)
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      />
                      {manualToken && !isValidGitHubToken(manualToken) && (
                        <p className="text-xs text-red-500 mt-1">Token 格式不正确，应以 ghp_ 或 github_pat_ 开头</p>
                      )}
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=Claude%20Skill%20Creator"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                      >
                        获取 Token
                      </a>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm mb-2">将创建仓库: <strong>{generated.name}</strong></p>
                  <p className="text-xs text-gray-500">包含 SKILL.md 和 README.md，自动添加 topics</p>
                </div>

                {uploadResult?.error && (
                  <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
                    <p className="text-sm text-red-600">{uploadResult.error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("preview")}
                    className="px-6 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    返回
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!activeToken || (manualToken && !isValidGitHubToken(manualToken)) || uploading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-medium transition-all"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <Github className="w-5 h-5" />
                        创建仓库并上传
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
