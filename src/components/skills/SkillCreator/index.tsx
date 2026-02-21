"use client";

import { useState } from "react";
import { X, Sparkles, Check, Layers, Terminal } from "lucide-react";
import { useUIStore, useAuthStore } from "@/store";
import { PLATFORM_THEME } from "@/constants";
import { StepInput } from "./StepInput";
import { StepPreview } from "./StepPreview";
import { StepUpload } from "./StepUpload";

export type CreatorStep = "input" | "preview" | "upload";
export type Platform = "claude" | "openclaw";
export type InputMode = "description" | "document";

export interface GeneratedSkill {
  platform: string;
  name: string;
  skillMd?: string;
  skillTs?: string;
  readme: string;
  category: string;
  tags: string[];
  validation: { valid: boolean; errors: string[]; warnings?: string[] };
  installCommand: string;
}

export interface SecurityScan {
  safe: boolean;
  risk: string;
  warnings: string[];
  blocked: boolean;
}

export function SkillCreator() {
  const { showCreator, setShowCreator, showToast } = useUIStore();
  const { user, isAuthenticated } = useAuthStore();

  // Steps
  const [step, setStep] = useState<CreatorStep>("input");

  // Input
  const [inputMode, setInputMode] = useState<InputMode>("description");
  const [platform, setPlatform] = useState<Platform>("claude");
  const [description, setDescription] = useState("");
  const [docContent, setDocContent] = useState("");
  const [name, setName] = useState("");

  // Generation
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedSkill | null>(null);

  // Security
  const [scanning, setScanning] = useState(false);
  const [securityScan, setSecurityScan] = useState<SecurityScan | null>(null);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    repoUrl?: string;
    error?: string;
  } | null>(null);

  const theme = PLATFORM_THEME[platform];

  if (!showCreator) return null;

  async function handleGenerate() {
    const content = inputMode === "document" ? docContent : description;
    if (!content.trim()) return;

    setGenerating(true);
    setSecurityScan(null);

    try {
      const body: Record<string, unknown> = {
        platform,
        mode: inputMode,
        name,
      };

      if (inputMode === "document") {
        body.document = docContent;
      } else {
        body.description = description;
      }

      const res = await fetch("/api/skills/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.error) {
        showToast("error", data.error);
      } else {
        setGenerated(data);
        setName(data.name);

        // Security scan for Claude format
        if (data.skillMd) {
          await runSecurityScan(data.skillMd);
        }
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

  async function handleConvert() {
    if (!generated) return;

    try {
      const res = await fetch("/api/skills/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: generated.skillMd || generated.skillTs,
          targetFormat: generated.platform === "claude" ? "openclaw" : "claude",
        }),
      });
      const data = await res.json();

      if (data.success) {
        setGenerated({
          ...generated,
          platform: data.targetFormat,
          skillMd: data.result.skillMd,
          skillTs: data.result.skillTs,
          readme: data.result.readme,
          tags: data.result.tags || generated.tags,
        });
        showToast(
          "success",
          `已转换为 ${data.targetFormat === "openclaw" ? "OpenClaw" : "Claude"} 格式`
        );
      } else {
        showToast("error", data.error || "转换失败");
      }
    } catch {
      showToast("error", "转换失败");
    }
  }

  async function handleUpload() {
    if (!generated || !isAuthenticated) return;

    setUploading(true);
    try {
      const res = await fetch("/api/github/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

  function handleClose() {
    setShowCreator(false);
    // Reset state
    setStep("input");
    setGenerated(null);
    setSecurityScan(null);
    setUploadResult(null);
  }

  return (
    <div className="mb-8 rounded-3xl border-2 border-orange-100 bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-gray-900 dark:border-gray-800 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-orange-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${theme.gradient}`}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI 创建 Skill</h2>
            <p className="text-sm text-gray-500">
              创建后可一键转换为{" "}
              {platform === "claude" ? "OpenClaw Plugin" : "Claude Skill"}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Steps Indicator */}
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
              <span
                className={`text-sm ${
                  isActive ? "font-medium text-orange-600" : "text-gray-500"
                }`}
              >
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
          <StepInput
            inputMode={inputMode}
            setInputMode={setInputMode}
            platform={platform}
            setPlatform={setPlatform}
            description={description}
            setDescription={setDescription}
            docContent={docContent}
            setDocContent={setDocContent}
            name={name}
            setName={setName}
            generating={generating}
            onGenerate={handleGenerate}
          />
        )}

        {step === "preview" && generated && (
          <StepPreview
            generated={generated}
            scanning={scanning}
            securityScan={securityScan}
            onBack={() => setStep("input")}
            onConvert={handleConvert}
            onNext={() => setStep("upload")}
          />
        )}

        {step === "upload" && generated && (
          <StepUpload
            generated={generated}
            user={user}
            isAuthenticated={isAuthenticated}
            uploading={uploading}
            uploadResult={uploadResult}
            onBack={() => setStep("preview")}
            onUpload={handleUpload}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}
