"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Only the dashboard has been reskinned dark so far — everywhere else
  // keeps its original light page background untouched. Setting the color
  // on this root (instead of on a floating panel with margins) means there
  // is no gap anywhere that can show the light body color through.
  const dark = pathname.startsWith("/dashboard");

  return (
    <div className={cn("min-h-screen", dark && "bg-[#0B0817]")}>
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
