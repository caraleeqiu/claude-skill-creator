"use client";

import { useState, useRef, useCallback } from "react";
import {
  Terminal,
  Layers,
  Sparkles,
  BookOpen,
  ArrowLeftRight,
  RefreshCw,
  Link,
  Upload,
  FileText,
  X,
  Loader2,
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

// 检测是否为 URL
function isUrl(text: string): boolean {
  const trimmed = text.trim();
  return /^https?:\/\/\S+$/i.test(trimmed);
}

// 支持的文件类型
const SUPPORTED_FILE_TYPES = [
  ".txt",
  ".md",
  ".markdown",
  ".pdf",
  ".json",
  ".yaml",
  ".yml",
];
const SUPPORTED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/json",
  "text/yaml",
];

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

  // URL 抓取状态
  const [urlInput, setUrlInput] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState("");

  // 文件上传状态
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL 抓取
  const handleFetchUrl = useCallback(async () => {
    if (!urlInput.trim() || !isUrl(urlInput)) {
      setUrlError("请输入有效的 URL");
      return;
    }

    setFetchingUrl(true);
    setUrlError("");

    try {
      const res = await fetch("/api/skills/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();

      if (data.error) {
        setUrlError(data.error);
      } else {
        setDocContent(data.content);
        if (data.title && !name) {
          // 从标题生成名称
          const autoName = data.title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 30);
          setName(autoName);
        }
        setUrlInput("");
      }
    } catch {
      setUrlError("获取失败，请手动复制内容");
    }

    setFetchingUrl(false);
  }, [urlInput, name, setDocContent, setName]);

  // 文件上传处理
  const handleFileUpload = useCallback(
    async (file: File) => {
      // 检查文件大小 (最大 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUrlError("文件过大，请选择 5MB 以内的文件");
        return;
      }

      // 检查文件类型
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!SUPPORTED_FILE_TYPES.includes(ext) && !SUPPORTED_MIME_TYPES.includes(file.type)) {
        setUrlError(`不支持的文件类型，支持: ${SUPPORTED_FILE_TYPES.join(", ")}`);
        return;
      }

      setUrlError("");

      // PDF 需要特殊处理
      if (file.type === "application/pdf" || ext === ".pdf") {
        // 发送到服务端解析
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/skills/upload-file", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          if (data.error) {
            setUrlError(data.error);
          } else {
            setDocContent(data.content);
            setUploadedFile(file.name);
          }
        } catch {
          setUrlError("文件解析失败");
        }
      } else {
        // 文本文件直接读取
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setDocContent(content);
          setUploadedFile(file.name);
        };
        reader.onerror = () => {
          setUrlError("文件读取失败");
        };
        reader.readAsText(file);
      }
    },
    [setDocContent]
  );

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  // 清除上传的文件
  const clearUploadedFile = useCallback(() => {
    setUploadedFile(null);
    setDocContent("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [setDocContent]);

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
        <div className="space-y-4">
          {/* URL 输入 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Link className="w-4 h-4 inline mr-1" />
              从链接获取
              <span className="text-xs text-gray-500 ml-2">
                支持 Twitter/X、Reddit、GitHub、网页
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlError("");
                }}
                placeholder="https://twitter.com/... 或 https://reddit.com/..."
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-0"
              />
              <button
                onClick={handleFetchUrl}
                disabled={fetchingUrl || !urlInput.trim()}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                {fetchingUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
                获取
              </button>
            </div>
            {urlError && (
              <p className="mt-1 text-xs text-red-500">{urlError}</p>
            )}
          </div>

          {/* 文件上传 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              上传文档
              <span className="text-xs text-gray-500 ml-2">
                支持 TXT、Markdown、PDF、JSON、YAML
              </span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,.pdf,.json,.yaml,.yml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />
            {uploadedFile ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-500/10 border-2 border-green-200 dark:border-green-500/30 rounded-xl">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="flex-1 text-sm text-green-700 dark:text-green-400">
                  {uploadedFile}
                </span>
                <button
                  onClick={clearUploadedFile}
                  className="p-1 hover:bg-green-100 dark:hover:bg-green-500/20 rounded"
                >
                  <X className="w-4 h-4 text-green-600" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  dragOver
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                    : "border-gray-300 dark:border-gray-600 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-500/5"
                }`}
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  点击选择或拖拽文件到此处
                </p>
                <p className="text-xs text-gray-400 mt-1">最大 5MB</p>
              </div>
            )}
          </div>

          {/* 分隔线 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400">或直接粘贴内容</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* 文本输入 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              粘贴文档/帖子内容
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
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-0 resize-none font-mono text-sm"
            />
            {docContent.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                已输入 {docContent.length} 字符{" "}
                {docContent.length > 100 ? "✓" : "(建议至少 100 字)"}
              </p>
            )}
          </div>
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
