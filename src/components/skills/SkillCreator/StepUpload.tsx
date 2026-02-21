"use client";

import { Check, Github, RefreshCw } from "lucide-react";
import { PLATFORM_THEME } from "@/constants";
import type { GeneratedSkill } from "./index";

interface StepUploadProps {
  generated: GeneratedSkill;
  user: { login: string; avatar: string } | null;
  isAuthenticated: boolean;
  uploading: boolean;
  uploadResult: { success: boolean; repoUrl?: string; error?: string } | null;
  onBack: () => void;
  onUpload: () => void;
  onClose: () => void;
}

export function StepUpload({
  generated,
  user,
  isAuthenticated,
  uploading,
  uploadResult,
  onBack,
  onUpload,
  onClose,
}: StepUploadProps) {
  const isOpenClaw = generated.platform === "openclaw";
  const theme = isOpenClaw ? PLATFORM_THEME.openclaw : PLATFORM_THEME.claude;

  // Success state
  if (uploadResult?.success) {
    return (
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            安装命令:
          </p>
          <code className="text-sm font-mono text-orange-500 break-all">
            curl -sL {uploadResult.repoUrl}/raw/main/SKILL.md -o
            ~/.claude/commands/{generated.name}.md
          </code>
        </div>
        <button
          onClick={onClose}
          className={`mt-6 px-8 py-3 text-white rounded-xl font-medium bg-gradient-to-r ${theme.gradient}`}
        >
          完成
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auth Status */}
      {isAuthenticated && user ? (
        <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl flex items-center gap-3">
          <img
            src={user.avatar}
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-medium text-green-600">已登录: {user.login}</p>
            <p className="text-sm text-green-500">将上传到你的 GitHub 账号</p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl">
          <p className="text-sm text-blue-600 mb-3">
            请先登录 GitHub，将自动创建仓库到你的账号
          </p>
          <a
            href="/api/auth/github"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium"
          >
            <Github className="w-5 h-5" />
            使用 GitHub 登录
          </a>
        </div>
      )}

      {/* Repo Info */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <p className="text-sm mb-2">
          将创建仓库: <strong>{generated.name}</strong>
        </p>
        <p className="text-xs text-gray-500">
          包含 SKILL.md 和 README.md，自动添加 topics
        </p>
      </div>

      {/* Error */}
      {uploadResult?.error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
          <p className="text-sm text-red-600">{uploadResult.error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          返回
        </button>
        <button
          onClick={onUpload}
          disabled={!isAuthenticated || uploading}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl font-medium transition-all bg-gradient-to-r ${theme.gradient} ${theme.hoverGradient} disabled:from-gray-300 disabled:to-gray-400`}
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
    </div>
  );
}
