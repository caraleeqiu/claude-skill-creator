"use client";

import {
  Star,
  ExternalLink,
  Terminal,
  Check,
  Package,
  HelpCircle,
} from "lucide-react";
import type { Skill } from "@/types/skill";
import { useUIStore } from "@/store";
import { PLATFORM_THEME } from "@/constants";

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  const { copiedId, setCopiedId, showToast, setShowOpenClawGuide } = useUIStore();
  const copied = copiedId === skill.id;

  const isOpenClaw = skill.platform === "openclaw";
  const isBoth = skill.platform === "both";
  const theme = isOpenClaw ? PLATFORM_THEME.openclaw : PLATFORM_THEME.claude;

  async function copyInstallScript() {
    let script: string;

    if (skill.platform === "openclaw") {
      script = `openclaw plugin install ${skill.name}`;
      if (skill.repo_url.includes("github.com")) {
        script = `# 方式1: 使用 OpenClaw CLI\nopenclaw plugin install ${skill.name}\n\n# 方式2: 手动克隆\ngit clone ${skill.repo_url.replace("/tree/main", "").replace("/tree/master", "")} ~/.openclaw/plugins/${skill.name}`;
      }
    } else if (skill.skill_md_url) {
      const rawUrl = skill.skill_md_url
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/");
      script = `mkdir -p ~/.claude/commands && curl -sL "${rawUrl}" -o ~/.claude/commands/${skill.name}.md`;
    } else if (skill.repo_url.includes("/tree/")) {
      const rawUrl =
        skill.repo_url
          .replace("github.com", "raw.githubusercontent.com")
          .replace("/tree/", "/") + "/SKILL.md";
      script = `mkdir -p ~/.claude/commands && curl -sL "${rawUrl}" -o ~/.claude/commands/${skill.name}.md`;
    } else {
      const rawUrl =
        skill.repo_url.replace("github.com", "raw.githubusercontent.com") +
        "/main/SKILL.md";
      script = `mkdir -p ~/.claude/commands && curl -sL "${rawUrl}" -o ~/.claude/commands/${skill.name}.md`;
    }

    await navigator.clipboard.writeText(script);
    setCopiedId(skill.id);
    showToast(
      "success",
      isOpenClaw ? "已复制 OpenClaw 安装命令！" : "已复制！在终端粘贴执行即可安装"
    );
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div
      className={`group p-6 rounded-2xl border-2 bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300 ${
        isOpenClaw
          ? "border-purple-100 dark:border-purple-900/50 hover:border-purple-200 hover:shadow-purple-500/10"
          : "border-gray-100 dark:border-gray-800 hover:border-orange-200 hover:shadow-orange-500/10"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg">
            {skill.name}
          </h3>
          {/* Platform Badge */}
          {isOpenClaw ? (
            <button
              onClick={() => setShowOpenClawGuide(true)}
              className="flex-shrink-0 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-600 rounded-md font-medium hover:bg-purple-200 dark:hover:bg-purple-500/30 transition-colors flex items-center gap-1"
              title="点击查看 OpenClaw 安装指南"
            >
              <Package className="w-3 h-3" />
              OpenClaw
            </button>
          ) : isBoth ? (
            <span className="flex-shrink-0 px-2 py-0.5 text-xs bg-gradient-to-r from-orange-100 to-purple-100 dark:from-orange-500/20 dark:to-purple-500/20 text-gray-600 dark:text-gray-300 rounded-md font-medium">
              Both
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1 text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg flex-shrink-0">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm font-medium">{skill.stars}</span>
        </div>
      </div>

      {/* OpenClaw Environment Notice */}
      {isOpenClaw && (
        <div className="mb-3 px-3 py-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-xs text-purple-600 dark:text-purple-300 flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>需要 OpenClaw 环境</span>
          <button
            onClick={() => setShowOpenClawGuide(true)}
            className="ml-auto text-purple-500 hover:text-purple-700 underline"
          >
            如何安装?
          </button>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">
        {skill.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {skill.source && skill.source !== "github" && (
          <span
            className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
              skill.source === "twitter"
                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600"
                : skill.source === "reddit"
                ? "bg-orange-100 dark:bg-orange-500/20 text-orange-600"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            {skill.source === "twitter" ? "𝕏" : skill.source}
          </span>
        )}
        {skill.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative group/btn">
          <button
            onClick={copyInstallScript}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm rounded-xl transition-all font-medium shadow-md bg-gradient-to-r ${theme.gradient} ${theme.hoverGradient} ${theme.shadow}`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                已复制!
              </>
            ) : (
              <>
                <Terminal className="w-4 h-4" />
                复制安装命令
              </>
            )}
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {isOpenClaw ? "需要先安装 OpenClaw" : "复制后在终端粘贴执行"}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
        <a
          href={skill.source_url || skill.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-2.5 border-2 rounded-xl transition-all ${
            isOpenClaw
              ? "border-purple-100 dark:border-purple-900/50 hover:border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-500/10"
              : "border-gray-100 dark:border-gray-800 hover:border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-500/10"
          }`}
          title={skill.source === "github" ? "查看 GitHub 仓库" : "查看来源"}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
