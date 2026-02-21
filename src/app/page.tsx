"use client";

import { useEffect } from "react";
import { useSkillStore, useAuthStore } from "@/store";
import { ToastContainer, ErrorBoundary } from "@/components/ui";
import { Header, Footer } from "@/components/layout";
import {
  SkillFilters,
  CategoryCards,
  SkillGrid,
  SkillCreator,
  OpenClawGuideModal,
} from "@/components/skills";

export default function Home() {
  const { fetchSkills } = useSkillStore();
  const { checkAuth } = useAuthStore();

  // Initial data fetch
  useEffect(() => {
    fetchSkills();
    checkAuth();
  }, [fetchSkills, checkAuth]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <ToastContainer />
        <OpenClawGuideModal />

        <Header />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <SkillFilters />
          <CategoryCards />
          <SkillCreator />
          <SkillGrid />
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}
