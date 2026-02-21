"use client";

import { Zap, RefreshCw, Github, LogOut, Sparkles } from "lucide-react";
import { useAuthStore, useSkillStore, useUIStore } from "@/store";

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { refreshing, fetchSkills } = useSkillStore();
  const { setShowCreator } = useUIStore();

  return (
    <header className="border-b border-orange-100 bg-white/80 backdrop-blur-md dark:bg-gray-950/80 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Claude Skill Creator
              </h1>
              <p className="text-sm text-gray-500">
                发现、安装、创建 Claude Code Skills
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* GitHub Auth */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt=""
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm font-medium">{user.login}</span>
                <button
                  onClick={logout}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="退出登录"
                >
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

            {/* Refresh */}
            <button
              onClick={() => fetchSkills(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 dark:border-gray-700 dark:hover:border-orange-500 transition-all"
              title="刷新数据"
            >
              <RefreshCw
                className={`w-5 h-5 ${
                  refreshing ? "animate-spin text-orange-500" : "text-gray-600"
                }`}
              />
            </button>

            {/* Create Button */}
            <button
              onClick={() => setShowCreator(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-lg shadow-orange-500/25 transition-all font-medium"
            >
              <Sparkles className="w-4 h-4" />
              AI 创建 Skill
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
