"use client";

import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* pl matches the fixed rail's width + gap so this column never sits
          under it; pr keeps the same breathing room on the other side. */}
      <div className="flex flex-col items-center px-4 md:pl-24 md:pr-4">
        <div className="w-full max-w-[1400px]">
          <TopNav />
          <main className="pb-24 pt-2 md:pb-10">{children}</main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
