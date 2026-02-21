"use client";

import {
  Search,
  Hash,
  Layers,
  Rocket,
  Terminal,
  Code,
  Zap,
  FileText,
  Database,
  Palette,
  MessageSquare,
  Box,
} from "lucide-react";
import { useSkillStore } from "@/store";
import { SKILL_CATEGORIES, HOT_TAGS, USE_CASES } from "@/constants";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code,
  Zap,
  FileText,
  Rocket,
  Database,
  Palette,
  MessageSquare,
  Box,
};

export function SkillFilters() {
  const { filters, setFilter } = useSkillStore();

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Search & Category Select */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索 skills... (支持名称、描述、标签)"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl bg-white dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
          />
        </div>
        <select
          value={filters.category}
          onChange={(e) => setFilter("category", e.target.value)}
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

      {/* Platform Filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Layers className="w-3 h-3" /> 平台:
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("platform", "all")}
            className={`px-4 py-1.5 text-sm rounded-full transition-all ${
              filters.platform === "all"
                ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter("platform", "claude")}
            className={`px-4 py-1.5 text-sm rounded-full transition-all flex items-center gap-1.5 ${
              filters.platform === "claude"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-500/20"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Claude Code
          </button>
          <button
            onClick={() => setFilter("platform", "openclaw")}
            className={`px-4 py-1.5 text-sm rounded-full transition-all flex items-center gap-1.5 ${
              filters.platform === "openclaw"
                ? "bg-purple-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-500/20"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            OpenClaw
          </button>
        </div>
      </div>

      {/* Hot Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Hash className="w-3 h-3" /> 热门:
        </span>
        {filters.search && (
          <button
            onClick={() => setFilter("search", "")}
            className="px-3 py-1 text-xs rounded-full bg-gray-800 text-white dark:bg-white dark:text-gray-900"
          >
            全部
          </button>
        )}
        {HOT_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() =>
              setFilter("search", filters.search === tag ? "" : tag)
            }
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              filters.search === tag
                ? "bg-orange-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-orange-100 dark:hover:bg-orange-500/20"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Use Cases */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Rocket className="w-3 h-3" /> 场景:
        </span>
        <button
          onClick={() => setFilter("usecase", "all")}
          className={`px-3 py-1 text-xs rounded-full transition-all ${
            filters.usecase === "all"
              ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          全部
        </button>
        {USE_CASES.map((uc) => {
          const Icon = iconMap[uc.icon] || Rocket;
          return (
            <button
              key={uc.id}
              onClick={() =>
                setFilter("usecase", filters.usecase === uc.id ? "all" : uc.id)
              }
              className={`px-3 py-1.5 text-xs rounded-full transition-all flex items-center gap-1.5 ${
                filters.usecase === uc.id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-orange-100 dark:hover:bg-orange-500/20"
              }`}
              title={uc.description}
            >
              <Icon className="w-3 h-3" />
              {uc.name_cn}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryCards() {
  const { filters, setFilter } = useSkillStore();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3 mb-8">
      {/* All Category Button */}
      <button
        onClick={() => setFilter("category", "all")}
        className={`p-4 rounded-2xl border-2 transition-all ${
          filters.category === "all"
            ? "bg-gradient-to-br from-gray-700 to-gray-900 border-transparent text-white shadow-lg shadow-gray-500/25"
            : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300 hover:shadow-md"
        }`}
      >
        <Box className="w-6 h-6 mx-auto mb-2" />
        <p className="text-xs font-medium truncate">全部</p>
      </button>

      {SKILL_CATEGORIES.map((cat) => {
        const Icon = iconMap[cat.icon] || Box;
        const isActive = filters.category === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => setFilter("category", isActive ? "all" : cat.id)}
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
  );
}
