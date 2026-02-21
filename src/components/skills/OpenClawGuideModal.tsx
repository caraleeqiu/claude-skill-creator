"use client";

import { Layers, Github, BookOpen } from "lucide-react";
import { Modal } from "@/components/ui";
import { useUIStore } from "@/store";

export function OpenClawGuideModal() {
  const { showOpenClawGuide, setShowOpenClawGuide } = useUIStore();

  return (
    <Modal
      isOpen={showOpenClawGuide}
      onClose={() => setShowOpenClawGuide(false)}
      title="OpenClaw 使用指南"
      icon={
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
          <Layers className="w-5 h-5 text-white" />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>OpenClaw</strong>{" "}
            是一个 AI Agent 网关，支持 Telegram、Discord、Slack、WhatsApp
            等多平台消息。使用 OpenClaw 插件前需要先安装并配置。
          </p>
        </div>

        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center">
              1
            </span>
            安装 OpenClaw
          </h4>
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
            npm install -g openclaw
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center">
              2
            </span>
            配置消息平台
          </h4>
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
            <p className="text-gray-500"># 例如配置 Telegram</p>
            <p>openclaw config set telegram.token YOUR_BOT_TOKEN</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center">
              3
            </span>
            启动 Gateway
          </h4>
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
            openclaw gateway run
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <a
            href="https://github.com/openclaw/openclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            <Github className="w-4 h-4" />
            GitHub 仓库
          </a>
          <a
            href="https://docs.openclaw.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            查看文档
          </a>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          提示：你也可以把 OpenClaw 的使用经验转成 Claude Code Skill
        </p>
      </div>
    </Modal>
  );
}
