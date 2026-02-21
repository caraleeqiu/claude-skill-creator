"use client";

import { Box } from "lucide-react";
import { useSkillStore } from "@/store";
import { SkillCard } from "./SkillCard";
import { SkillGridSkeleton } from "@/components/ui";

export function SkillGrid() {
  const { filteredSkills, loading } = useSkillStore();

  if (loading) {
    return <SkillGridSkeleton count={6} />;
  }

  if (filteredSkills.length === 0) {
    return (
      <div className="text-center py-20">
        <Box className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 mb-2">没有找到相关 Skills</p>
        <p className="text-sm text-gray-400">
          试试调整搜索条件，或创建一个新的 Skill
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {filteredSkills.map((skill) => (
        <SkillCard key={skill.id} skill={skill} />
      ))}
    </div>
  );
}
