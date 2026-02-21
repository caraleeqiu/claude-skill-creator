"use client";

import {
  Terminal,
  Layers,
  Sparkles,
  BookOpen,
  ArrowLeftRight,
  RefreshCw,
} from "lucide-react";
import { PLATFORM_THEME } from "@/constants";
import type { Platform, InputMode } from "./index";

interface StepInputProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  platform: Platform;
  setPlatform: (platform: Platform) => void;
  description: string;
  setDescription: (value: string) => void;
  docContent: string;
  setDocContent: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  generating: boolean;
  onGenerate: () => void;
}

export function StepInput({
  inputMode,
  setInputMode,
  platform,
  setPlatform,
  description,
  setDescription,
  docContent,
  setDocContent,
  name,
  setName,
  generating,
  onGenerate,
}: StepInputProps) {
  const theme = PLATFORM_THEME[platform];
  const hasContent = inputMode === "document" ? docContent.trim() : description.trim();

  return (
    <div className="space-y-4">
      {/* Platform Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">目标平台</label>
        <div className="flex gap-3">
          <button
            onClick={() => setPlatform("claude")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
              platform === "claude"
                ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600"
                : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
            }`}
          >
            <Terminal className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Claude Code</div>
              <div className="text-xs opacity-70">SKILL.md 格式</div>
            </div>
          </button>
          <button
            onClick={() => setPlatform("openclaw")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
              platform === "openclaw"
                ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-600"
                : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
            }`}
          >
            <Layers className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">OpenClaw</div>
              <div className="text-xs opacity-70">Plugin 格式</div>
            </div>
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <ArrowLeftRight className="w-3 h-3" />
          <span>生成后可一键转换为另一种格式</span>
        </div>
      </div>

      {/* Input Mode Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">输入方式</label>
        <div className="flex gap-2">
          <button
            onClick={() => setInputMode("description")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              inputMode === "description"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            自然语言描述
          </button>
          <button
            onClick={() => setInputMode("document")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              inputMode === "document"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            从文档/帖子生成
          </button>
        </div>
      </div>

      {/* Input Area */}
      {inputMode === "description" ? (
        <div>
          <label className="block text-sm font-medium mb-2">
            描述你想要的 Skill
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例如：帮我创建一个自动生成 git commit message 的 skill，当我完成代码修改后，它会分析 git diff 的内容，然后生成符合 conventional commits 规范的提交信息..."
            rows={5}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-0 resize-none"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-2">
            粘贴文档/帖子内容
            <span className="text-xs text-gray-500 ml-2">
              支持 Markdown、纯文本
            </span>
          </label>
          <textarea
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            placeholder={`粘贴你的文章、教程、经验帖等内容...

例如一篇关于"如何高效使用 Git"的文章，系统会自动提取：
- 操作步骤
- 触发条件
- 代码示例
- 注意事项

然后生成对应的 Skill`}
            rows={8}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-0 resize-none font-mono text-sm"
          />
          {docContent.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              已输入 {docContent.length} 字符{" "}
              {docContent.length > 100 ? "✓" : "(建议至少 100 字)"}
            </p>
          )}
        </div>
      )}

      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Skill 名称 (可选)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "")
            )
          }
          placeholder="auto-commit-message"
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-0"
        />
        <p className="mt-1 text-xs text-gray-500">
          只能使用小写字母、数字和连字符
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={!hasContent || generating}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all text-white bg-gradient-to-r ${theme.gradient} ${theme.hoverGradient} disabled:from-gray-300 disabled:to-gray-400`}
      >
        {generating ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            生成 {platform === "openclaw" ? "OpenClaw Plugin" : "Claude Skill"}
          </>
        )}
      </button>
    </div>
  );
}
