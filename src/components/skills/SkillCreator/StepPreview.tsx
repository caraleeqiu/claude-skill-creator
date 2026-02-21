"use client";

import { useState } from "react";
import {
  FileText,
  FileCode,
  Layers,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileDown,
  Upload,
  ArrowLeftRight,
} from "lucide-react";
import { useUIStore } from "@/store";
import { PLATFORM_THEME } from "@/constants";
import type { GeneratedSkill, SecurityScan } from "./index";

interface StepPreviewProps {
  generated: GeneratedSkill;
  scanning: boolean;
  securityScan: SecurityScan | null;
  onBack: () => void;
  onConvert: () => void;
  onNext: () => void;
}

export function StepPreview({
  generated,
  scanning,
  securityScan,
  onBack,
  onConvert,
  onNext,
}: StepPreviewProps) {
  const { showToast } = useUIStore();
  const [copied, setCopied] = useState(false);

  const isOpenClaw = generated.platform === "openclaw";
  const theme = isOpenClaw ? PLATFORM_THEME.openclaw : PLATFORM_THEME.claude;
  const content = generated.skillMd || generated.skillTs || "";

  async function copyToClipboard() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    showToast("success", "已复制到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadZip() {
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
        const blob = new Blob(
          [Uint8Array.from(atob(data.content), (c) => c.charCodeAt(0))],
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

  return (
    <div className="space-y-4">
      {/* Platform Badge */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${theme.bg} ${theme.text}`}
      >
        {isOpenClaw ? (
          <>
            <Layers className="w-4 h-4" /> OpenClaw Plugin
          </>
        ) : (
          <>
            <Terminal className="w-4 h-4" /> Claude Skill
          </>
        )}
      </div>

      {/* Security Scan (Claude only) */}
      {generated.platform === "claude" && (
        <>
          {scanning ? (
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-blue-600">正在进行安全扫描...</span>
            </div>
          ) : (
            securityScan && (
              <div
                className={`p-4 rounded-xl border ${
                  securityScan.blocked
                    ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                    : securityScan.safe
                    ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30"
                    : "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {securityScan.blocked ? (
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  ) : securityScan.safe ? (
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <Shield className="w-5 h-5 text-yellow-500" />
                  )}
                  <span
                    className={`font-medium ${
                      securityScan.blocked
                        ? "text-red-600"
                        : securityScan.safe
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {securityScan.blocked
                      ? "安全风险: 已阻止"
                      : securityScan.safe
                      ? "安全扫描: 通过"
                      : `安全风险: ${securityScan.risk}`}
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
            )
          )}
        </>
      )}

      {/* Validation Errors */}
      {!generated.validation.valid && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
          <p className="font-medium text-red-600 mb-2">格式警告</p>
          {generated.validation.errors.map((err, i) => (
            <p key={i} className="text-sm text-red-500">
              • {err}
            </p>
          ))}
        </div>
      )}

      {/* Preview */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Code Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium flex items-center gap-2">
              {isOpenClaw ? (
                <>
                  <FileCode className="w-4 h-4" /> skill.ts
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" /> SKILL.md
                </>
              )}
            </label>
            <button
              onClick={copyToClipboard}
              className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "已复制" : "复制"}
            </button>
          </div>
          <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-sm overflow-auto h-72 font-mono">
            {content}
          </pre>
        </div>

        {/* Install Instructions */}
        <div>
          <label className="block text-sm font-medium mb-2">安装方式</label>
          <div className="p-4 bg-gray-900 text-green-400 rounded-xl text-sm font-mono mb-4">
            {isOpenClaw ? (
              <>
                <p className="text-gray-500 mb-2"># 方式1: 使用 OpenClaw CLI</p>
                <p className="break-all">openclaw plugin install {generated.name}</p>
                <p className="text-gray-500 mt-3 mb-2"># 方式2: 手动安装</p>
                <p className="break-all">
                  git clone YOUR_REPO ~/.openclaw/plugins/{generated.name}
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-2">
                  # 方式1: 直接保存到 commands 目录
                </p>
                <p className="break-all">mkdir -p ~/.claude/commands</p>
                <p className="text-gray-500 mt-3 mb-2">
                  # 将内容保存为 ~/.claude/commands/{generated.name}.md
                </p>
                <p className="text-gray-500 mt-3 mb-2">
                  # 方式2: 使用 /{generated.name} 触发
                </p>
              </>
            )}
          </div>

          {/* Category & Tags */}
          <div className={`p-4 rounded-xl ${theme.bg}`}>
            <p className={`text-sm font-medium mb-2 ${theme.text}`}>
              分类: {generated.category}
            </p>
            <div className="flex flex-wrap gap-2">
              {generated.tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2 py-1 rounded-md text-xs ${theme.bg} ${theme.text}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Convert Button */}
          <button
            onClick={onConvert}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            <ArrowLeftRight className="w-4 h-4" />
            转换为 {isOpenClaw ? "Claude" : "OpenClaw"} 格式
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onBack}
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
          onClick={copyToClipboard}
          className={`flex items-center gap-2 px-6 py-3 border-2 rounded-xl transition-colors font-medium ${theme.border} ${theme.text} hover:${theme.bg}`}
        >
          <Terminal className="w-5 h-5" />
          复制内容
        </button>
        <button
          onClick={onNext}
          disabled={securityScan?.blocked}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all text-white bg-gradient-to-r ${theme.gradient} ${theme.hoverGradient} disabled:from-gray-300 disabled:to-gray-400`}
        >
          <Upload className="w-5 h-5" />
          上传到 GitHub
        </button>
      </div>
    </div>
  );
}
